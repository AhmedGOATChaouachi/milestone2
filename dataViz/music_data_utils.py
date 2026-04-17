from __future__ import annotations

from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass
from html import unescape
from pathlib import Path
import re

import numpy as np
import pandas as pd


DATASET_FILES = {
    "tags": "Tags",
    "artist_tags": "ArtistTags",
    "artists": "ArtistsMap",
    "users": "UsersData_anonymized",
    "network": "network",
}

USER_COLUMNS = [
    "user_id",
    "age_raw",
    "gender_raw",
    "country_raw",
    "playcount_raw",
    "registered_day",
    "registered_month",
    "registered_year",
]

NETWORK_COLUMNS = ["user_id_source", "user_id_target"]
ARTIST_COLUMNS = ["artist_id", "artist_mbid", "artist_name"]
TAG_COLUMNS = ["tag_raw", "tag", "global_count"]
ARTIST_TAG_COLUMNS = ["artist_id", "artist_mbid", "tag_raw", "tag", "weight"]


@dataclass(frozen=True)
class ArtistTagSummary:
    dataset_metrics: pd.DataFrame
    top_tags: pd.DataFrame
    top_artists: pd.DataFrame
    weight_summary: pd.Series


def dataset_path(root: str | Path, dataset_name: str) -> Path:
    return Path(root) / DATASET_FILES[dataset_name]


def normalize_text(value: str) -> str:
    cleaned = unescape(value).replace("\xa0", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_tag(value: str) -> str | pd.NA:
    cleaned = normalize_text(value).lower()
    return cleaned or pd.NA


def strip_newline(line: str) -> str:
    return line.rstrip("\r\n")


def parse_tag_line(line: str) -> tuple[str, str | pd.NA, int]:
    raw = strip_newline(line)
    tag_raw, count = raw.rsplit(" ", 1)
    return tag_raw, normalize_tag(tag_raw), int(count)


def parse_artist_line(line: str) -> tuple[int, str, str]:
    raw = strip_newline(line)
    first_sep = raw.find(";")
    second_sep = raw.find(";", first_sep + 1)
    if first_sep == -1 or second_sep == -1:
        raise ValueError(f"Malformed artist row: {raw!r}")

    return (
        int(raw[:first_sep]),
        raw[first_sep + 1 : second_sep],
        normalize_text(raw[second_sep + 1 :]),
    )


def parse_artist_tag_line(line: str) -> tuple[int, str, str, str | pd.NA, int]:
    raw = strip_newline(line)
    first_sep = raw.find(";")
    second_sep = raw.find(";", first_sep + 1)
    last_sep = raw.rfind(";")
    if first_sep == -1 or second_sep == -1 or last_sep == -1 or second_sep == last_sep:
        raise ValueError(f"Malformed artist-tag row: {raw!r}")

    tag_raw = raw[second_sep + 1 : last_sep]
    return (
        int(raw[:first_sep]),
        raw[first_sep + 1 : second_sep],
        tag_raw,
        normalize_tag(tag_raw),
        int(raw[last_sep + 1 :].strip()),
    )


def load_tags(root: str | Path = ".") -> pd.DataFrame:
    rows: list[tuple[str, str | pd.NA, int]] = []
    with dataset_path(root, "tags").open("r", encoding="utf-8") as handle:
        for line in handle:
            rows.append(parse_tag_line(line))

    return pd.DataFrame(rows, columns=TAG_COLUMNS)


def load_artists(root: str | Path = ".") -> pd.DataFrame:
    rows: list[tuple[int, str, str]] = []
    with dataset_path(root, "artists").open("r", encoding="utf-8") as handle:
        for line in handle:
            rows.append(parse_artist_line(line))

    return pd.DataFrame(rows, columns=ARTIST_COLUMNS)


def load_users(root: str | Path = ".") -> pd.DataFrame:
    users = pd.read_csv(
        dataset_path(root, "users"),
        sep=";",
        header=None,
        names=USER_COLUMNS,
        dtype={
            "user_id": "int64",
            "age_raw": "int64",
            "gender_raw": "string",
            "country_raw": "string",
            "playcount_raw": "int64",
            "registered_day": "int64",
            "registered_month": "int64",
            "registered_year": "int64",
        },
    )

    users["country"] = users["country_raw"].fillna("").map(normalize_text).replace("", pd.NA)
    users["country"] = users["country"].str.upper()

    users["gender"] = users["gender_raw"].str.lower().replace(
        {"m": "male", "f": "female", "n": "not_shared", "": pd.NA}
    )

    users["age"] = users["age_raw"].where(users["age_raw"] >= 0, pd.NA).astype("Float64")
    users["playcount"] = users["playcount_raw"].where(users["playcount_raw"] >= 0, pd.NA).astype("Float64")

    plausible_age = users["age"].between(10, 90, inclusive="both")
    users["age_clean"] = users["age"].where(plausible_age, pd.NA)

    users["registered_at"] = pd.to_datetime(
        {
            "year": users["registered_year"],
            "month": users["registered_month"],
            "day": users["registered_day"],
        },
        errors="coerce",
    )

    return users


def load_network(root: str | Path = ".", deduplicate: bool = False) -> pd.DataFrame:
    network = pd.read_csv(
        dataset_path(root, "network"),
        sep=";",
        header=None,
        names=NETWORK_COLUMNS,
        dtype={"user_id_source": "int64", "user_id_target": "int64"},
    )

    network = network.loc[network["user_id_source"] != network["user_id_target"]].copy()
    network["user_id_min"] = network[["user_id_source", "user_id_target"]].min(axis=1)
    network["user_id_max"] = network[["user_id_source", "user_id_target"]].max(axis=1)

    if deduplicate:
        network = network.drop_duplicates(subset=["user_id_min", "user_id_max"]).reset_index(drop=True)

    return network


def iter_artist_tags(root: str | Path = ".", limit: int | None = None) -> Iterator[tuple[int, str, str, str | pd.NA, int]]:
    buffered_row = ""
    logical_rows = 0

    with dataset_path(root, "artist_tags").open("r", encoding="utf-8") as handle:
        for line in handle:
            piece = strip_newline(line)
            if not piece and not buffered_row:
                continue

            buffered_row = piece if not buffered_row else f"{buffered_row} {piece}".strip()
            if not is_complete_artist_tag_record(buffered_row):
                continue

            yield parse_artist_tag_line(buffered_row)
            buffered_row = ""
            logical_rows += 1

            if limit is not None and logical_rows >= limit:
                break

    if buffered_row:
        raise ValueError(f"Unterminated artist-tag row at end of file: {buffered_row!r}")


def iter_artist_tag_chunks(
    root: str | Path = ".",
    chunk_size: int = 250_000,
    limit: int | None = None,
) -> Iterator[pd.DataFrame]:
    chunk: list[tuple[int, str, str, str | pd.NA, int]] = []
    for row in iter_artist_tags(root=root, limit=limit):
        chunk.append(row)
        if len(chunk) >= chunk_size:
            yield pd.DataFrame(chunk, columns=ARTIST_TAG_COLUMNS)
            chunk = []

    if chunk:
        yield pd.DataFrame(chunk, columns=ARTIST_TAG_COLUMNS)


def load_artist_tags(root: str | Path = ".", limit: int | None = None) -> pd.DataFrame:
    return pd.DataFrame(iter_artist_tags(root=root, limit=limit), columns=ARTIST_TAG_COLUMNS)


def build_overview(
    users: pd.DataFrame,
    artists: pd.DataFrame,
    tags: pd.DataFrame,
    network: pd.DataFrame,
    artist_tag_summary: ArtistTagSummary,
) -> pd.DataFrame:
    metrics = {
        "users": len(users),
        "artists": len(artists),
        "global_tags": len(tags),
        "artist_tag_rows": int(
            artist_tag_summary.dataset_metrics.loc[
                artist_tag_summary.dataset_metrics["metric"] == "artist_tag_rows", "value"
            ].iat[0]
        ),
        "network_edges_raw": len(network),
        "network_edges_unique": int(network[["user_id_min", "user_id_max"]].drop_duplicates().shape[0]),
        "connected_users": int(
            pd.concat([network["user_id_source"], network["user_id_target"]], ignore_index=True).nunique()
        ),
    }

    return pd.DataFrame({"metric": list(metrics.keys()), "value": list(metrics.values())})


def compute_degree_table(network: pd.DataFrame) -> pd.DataFrame:
    degrees = pd.concat(
        [network["user_id_source"], network["user_id_target"]],
        ignore_index=True,
    ).value_counts()

    return degrees.rename_axis("user_id").reset_index(name="degree")


def summarize_artist_tags(
    root: str | Path = ".",
    artists: pd.DataFrame | None = None,
    chunk_size: int = 250_000,
    top_n: int = 20,
) -> ArtistTagSummary:
    tag_counter: Counter[str] = Counter()
    artist_tag_count: Counter[int] = Counter()
    artist_weight_sum: Counter[int] = Counter()
    artist_weight_max: dict[int, int] = {}
    weight_counts: Counter[int] = Counter()

    row_count = 0
    rows_with_missing_tag = 0
    unique_artist_ids: set[int] = set()

    for chunk in iter_artist_tag_chunks(root=root, chunk_size=chunk_size):
        row_count += len(chunk)
        unique_artist_ids.update(chunk["artist_id"].tolist())
        rows_with_missing_tag += int(chunk["tag"].isna().sum())

        tag_counter.update(chunk["tag"].dropna().tolist())
        weight_counts.update(chunk["weight"].tolist())

        artist_rollup = (
            chunk.groupby("artist_id", as_index=True)
            .agg(tag_rows=("tag", "size"), weight_sum=("weight", "sum"), weight_max=("weight", "max"))
        )

        artist_tag_count.update(artist_rollup["tag_rows"].to_dict())
        artist_weight_sum.update(artist_rollup["weight_sum"].to_dict())
        for artist_id, weight_max in artist_rollup["weight_max"].items():
            current = artist_weight_max.get(int(artist_id))
            artist_weight_max[int(artist_id)] = int(weight_max) if current is None else max(current, int(weight_max))

    dataset_metrics = pd.DataFrame(
        {
            "metric": [
                "artist_tag_rows",
                "artists_with_tags",
                "unique_clean_tags",
                "rows_with_missing_clean_tag",
            ],
            "value": [
                row_count,
                len(unique_artist_ids),
                len(tag_counter),
                rows_with_missing_tag,
            ],
        }
    )

    top_tags = (
        pd.DataFrame(tag_counter.items(), columns=["tag", "artist_tag_rows"])
        .sort_values("artist_tag_rows", ascending=False)
        .head(top_n)
        .reset_index(drop=True)
    )

    top_artists = pd.DataFrame(
        {
            "artist_id": list(artist_tag_count.keys()),
            "artist_tag_rows": list(artist_tag_count.values()),
            "weight_sum": [artist_weight_sum[artist_id] for artist_id in artist_tag_count],
            "weight_max": [artist_weight_max[artist_id] for artist_id in artist_tag_count],
        }
    )
    top_artists["average_weight"] = top_artists["weight_sum"] / top_artists["artist_tag_rows"]
    top_artists = top_artists.sort_values(
        ["artist_tag_rows", "average_weight"],
        ascending=[False, False],
    ).head(top_n)

    if artists is not None:
        top_artists = top_artists.merge(artists, on="artist_id", how="left")

    top_artists = top_artists.reset_index(drop=True)

    weight_summary = describe_weight_counts(weight_counts)

    return ArtistTagSummary(
        dataset_metrics=dataset_metrics,
        top_tags=top_tags,
        top_artists=top_artists,
        weight_summary=weight_summary,
    )


def describe_weight_counts(weight_counts: Counter[int]) -> pd.Series:
    weights = np.array(sorted(weight_counts.keys()), dtype="float64")
    counts = np.array([weight_counts[int(weight)] for weight in weights], dtype="float64")
    total = counts.sum()

    if total == 0:
        return pd.Series(dtype="float64")

    mean = np.average(weights, weights=counts)
    variance = np.average((weights - mean) ** 2, weights=counts)
    cumulative = np.cumsum(counts) / total

    def weighted_quantile(quantile: float) -> float:
        position = np.searchsorted(cumulative, quantile, side="left")
        position = min(position, len(weights) - 1)
        return float(weights[position])

    return pd.Series(
        {
            "count": float(total),
            "mean": float(mean),
            "std": float(np.sqrt(variance)),
            "min": float(weights[0]),
            "25%": weighted_quantile(0.25),
            "50%": weighted_quantile(0.50),
            "75%": weighted_quantile(0.75),
            "90%": weighted_quantile(0.90),
            "99%": weighted_quantile(0.99),
            "max": float(weights[-1]),
        }
    )


def is_complete_artist_tag_record(raw: str) -> bool:
    first_sep = raw.find(";")
    second_sep = raw.find(";", first_sep + 1)
    last_sep = raw.rfind(";")
    if first_sep == -1 or second_sep == -1 or last_sep == -1 or second_sep == last_sep:
        return False

    return raw[last_sep + 1 :].strip().isdigit()
