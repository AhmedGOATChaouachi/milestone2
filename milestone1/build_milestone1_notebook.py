from __future__ import annotations

from pathlib import Path
from textwrap import dedent

import nbformat as nbf


ROOT = Path(__file__).resolve().parent
NOTEBOOK_PATH = ROOT / "eda_second_degree.ipynb"


def markdown_cell(text: str):
    return nbf.v4.new_markdown_cell(dedent(text).strip())


def code_cell(code: str):
    return nbf.v4.new_code_cell(dedent(code).strip())


def build_notebook() -> nbf.NotebookNode:
    notebook = nbf.v4.new_notebook()
    notebook["metadata"] = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.12",
        },
    }

    notebook["cells"] = [
        markdown_cell(
            """
            # Milestone 1 EDA: Second-Degree Connections

            This notebook reframes the exploratory analysis around the actual project story: the value of second-degree connections in the Last.fm UK friendship network.

            The goal is to answer three questions:

            - how large is the reachable second-degree layer compared with direct friends?
            - how much overlap remains when we filter by user attributes such as country and age group?
            - which example users make the interaction legible enough for a first prototype?
            """
        ),
        markdown_cell(
            """
            ## Important correction

            The local workspace supports **age-group** and **country** matching directly, because these fields are present in `UsersData_anonymized`.

            However, the local workspace does **not** contain a user-to-artist listening table, so user-level music-taste matching cannot be computed from the available files alone. That means the implemented analysis focuses on second-degree matching through age and country, while music-taste matching remains a documented next step if the listening-history file is added later.
            """
        ),
        code_cell(
            """
            %matplotlib inline

            import json
            from pathlib import Path

            import matplotlib.pyplot as plt
            import pandas as pd
            from IPython.display import display

            plt.style.use("seaborn-v0_8-whitegrid")

            ROOT = Path.cwd()
            summary = json.loads((ROOT / "data" / "milestone1_summary.json").read_text(encoding="utf-8"))

            overview = pd.DataFrame(summary["overview"].items(), columns=["metric", "value"])
            quality = pd.DataFrame(summary["quality_checks"].items(), columns=["check", "value"])
            degree_hist = pd.DataFrame(summary["charts"]["degree_histogram"])
            second_hist = pd.DataFrame(summary["charts"]["second_degree_histogram"])
            shared_hist = pd.DataFrame(summary["charts"]["shared_attribute_histogram"])
            age_groups = pd.DataFrame(summary["charts"]["age_group_distribution"])
            countries = pd.DataFrame(summary["charts"]["top_countries"])
            case_sizes = pd.DataFrame(summary["charts"]["prototype_case_sizes"])
            """
        ),
        code_cell(
            """
            display(overview)
            display(quality)
            """
        ),
        markdown_cell(
            """
            ## Core takeaways
            """
        ),
        code_cell(
            """
            for idx, insight in enumerate(summary["insights"], start=1):
                print(f"{idx}. {insight}")
            """
        ),
        markdown_cell(
            """
            ## Who is in the network?
            """
        ),
        code_cell(
            """
            fig, axes = plt.subplots(1, 2, figsize=(14, 5))

            axes[0].bar(age_groups["label"], age_groups["value"], color="#bc6c25")
            axes[0].set_title("Age-group distribution")
            axes[0].set_ylabel("Users")

            axes[1].bar(countries["label"], countries["value"], color="#457b9d")
            axes[1].set_title("Top countries")
            axes[1].set_ylabel("Users")
            axes[1].tick_params(axis="x", rotation=45)

            plt.tight_layout()
            plt.show()
            """
        ),
        markdown_cell(
            """
            ## How much bigger is the second-degree layer?
            """
        ),
        code_cell(
            """
            fig, axes = plt.subplots(1, 2, figsize=(14, 5))

            axes[0].bar(degree_hist["label"], degree_hist["value"], color="#315c52")
            axes[0].set_title("Direct-friend degree histogram")
            axes[0].tick_params(axis="x", rotation=45)

            axes[1].bar(second_hist["label"], second_hist["value"], color="#7b5ea7")
            axes[1].set_title("Second-degree candidate histogram")
            axes[1].tick_params(axis="x", rotation=45)

            plt.tight_layout()
            plt.show()
            """
        ),
        markdown_cell(
            """
            The second plot is the one that matters for the product concept. Even users with a moderate number of direct friendships can reach a much larger pool of second-degree candidates once the network is expanded by one hop.
            """
        ),
        markdown_cell(
            """
            ## Shared attributes inside the second-degree layer
            """
        ),
        code_cell(
            """
            fig, ax = plt.subplots(figsize=(12, 5))
            ax.bar(shared_hist["label"], shared_hist["value"], color="#2a9d8f")
            ax.set_title("Second-degree candidates sharing both country and age group")
            ax.set_ylabel("Users")
            ax.tick_params(axis="x", rotation=45)
            plt.tight_layout()
            plt.show()
            """
        ),
        markdown_cell(
            """
            This is the bridge from graph structure to human meaning: not all friends-of-friends are equally relevant. The product will surface the subset that is structurally reachable **and** socially plausible according to shared traits.
            """
        ),
        markdown_cell(
            """
            ## Exemplar users for the prototype

            These cases are selected because they are readable, have a useful number of direct and second-degree connections, and keep enough profile information for age/country matching.
            """
        ),
        code_cell(
            """
            display(case_sizes)
            """
        ),
        code_cell(
            """
            cases = summary["prototype"]["cases"]
            example_tables = []
            for case in cases:
                table = pd.DataFrame(case["candidates"]).sort_values(
                    ["shared_attribute_count", "mutual_friends", "degree"],
                    ascending=[False, False, False],
                ).head(8)
                table.insert(0, "ego_user", case["user"]["id"])
                example_tables.append(table)

            display(pd.concat(example_tables, ignore_index=True))
            """
        ),
        markdown_cell(
            """
            ## Implication for the project direction

            The exploratory analysis supports the team vision: the second-degree layer is much richer than the first-degree layer, and attribute-based filtering makes that larger space more meaningful.

            The immediate implementation path is therefore:

            1. let the user select an ego node
            2. reveal direct and second-degree layers
            3. filter second-degree candidates by shared country and/or age group
            4. add music-taste matching as soon as a user-level listening table is available
            """
        ),
    ]

    return notebook


def main() -> None:
    notebook = build_notebook()
    nbf.write(notebook, NOTEBOOK_PATH)
    print(f"Wrote notebook to {NOTEBOOK_PATH}")


if __name__ == "__main__":
    main()
