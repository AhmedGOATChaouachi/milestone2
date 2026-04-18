from __future__ import annotations

from pathlib import Path
from textwrap import dedent

import nbformat as nbf


ROOT = Path(__file__).resolve().parent
NOTEBOOK_PATH = ROOT / "deep_analysis.ipynb"


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
            # Milestone 2 Deep Analysis

            This notebook supports the corrected project direction: second-degree connection value in the Last.fm UK friendship graph.
            """
        ),
        markdown_cell(
            """
            ## Scope note

            The local files support second-degree matching via **age group** and **country**. The intended music-taste layer is still part of the final vision, but it requires a user-level listening table that is not present in the current workspace.
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
            summary = json.loads((ROOT / "data" / "analysis_summary.json").read_text(encoding="utf-8"))

            overview = pd.DataFrame(summary["overview"].items(), columns=["metric", "value"])
            quality = pd.DataFrame(summary["quality_checks"].items(), columns=["check", "value"])
            age_groups = pd.DataFrame(summary["charts"]["age_group_distribution"])
            countries = pd.DataFrame(summary["charts"]["top_countries"])
            degree_hist = pd.DataFrame(summary["charts"]["degree_histogram"])
            second_hist = pd.DataFrame(summary["charts"]["second_degree_histogram"])
            shared_hist = pd.DataFrame(summary["charts"]["shared_attribute_histogram"])
            case_sizes = pd.DataFrame(summary["charts"]["prototype_case_sizes"])
            """
        ),
        code_cell(
            """
            display(overview)
            display(quality)
            """
        ),
        code_cell(
            """
            for idx, caveat in enumerate(summary["caveats"], start=1):
                print(f"{idx}. {caveat}")
            """
        ),
        markdown_cell(
            """
            ## Core findings
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
            ## User composition
            """
        ),
        code_cell(
            """
            fig, axes = plt.subplots(1, 2, figsize=(14, 5))

            axes[0].bar(age_groups["label"], age_groups["value"], color="#bc6c25")
            axes[0].set_title("Age-group distribution")
            axes[0].set_ylabel("Users")

            axes[1].bar(countries["label"], countries["value"], color="#4377a2")
            axes[1].set_title("Top countries")
            axes[1].set_ylabel("Users")
            axes[1].tick_params(axis="x", rotation=45)

            plt.tight_layout()
            plt.show()
            """
        ),
        markdown_cell(
            """
            ## From first-degree to second-degree
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
            The right-hand plot is the conceptual heart of the project. It shows why the second-degree layer is worth exploring at all: the reachable social space is much larger than the direct-friend layer.
            """
        ),
        markdown_cell(
            """
            ## Shared-trait opportunity
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
            This distribution is what turns the project into more than a graph display. The second-degree layer is still broad, but a meaningful subset survives once we ask which candidates actually resemble the ego user.
            """
        ),
        markdown_cell(
            """
            ## Prototype case studies
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
            for case in cases:
                print(f"User {case['user']['id']} | direct friends: {case['summary']['direct_friends']} | total second degree: {case['summary']['second_degree_count']}")
                candidate_table = pd.DataFrame(case["candidates"]).sort_values(
                    ["shared_attribute_count", "mutual_friends", "degree"],
                    ascending=[False, False, False],
                ).head(6)
                display(candidate_table)
            """
        ),
        markdown_cell(
            """
            ## Design implications

            1. The first screen of the final product must show expansion from first degree to second degree.
            2. Filters are not optional decoration: they are the mechanism that turns a large reachable layer into meaningful social opportunities.
            3. Candidate ranking should combine shared-attribute overlap with mutual-friend count.
            4. Music-taste matching should be implemented only when the necessary listening table is available, not invented from incomplete metadata.
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
