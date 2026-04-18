window.MILESTONE_DATA = {
  "generated_at_utc": "2026-03-19T05:29:05.770745+00:00",
  "dataset": {
    "title": "Last.fm UK User Graph Dataset",
    "source": "Zenodo",
    "doi": "10.5281/zenodo.10694369"
  },
  "caveats": [
    "The local workspace contains user demographics and the friendship graph, so age-group and country matching can be implemented directly.",
    "The local workspace does not contain a user-to-artist listening table, so music-taste matching cannot yet be computed at the user level from the available files alone.",
    "For that reason, the corrected prototype implements real second-degree filtering for age group and country, and reserves music-taste filtering as a documented next step if the listening-history file is added."
  ],
  "overview": {
    "users": 76778,
    "connected_users": 75969,
    "unique_friendships": 389639,
    "median_degree": 5,
    "median_second_degree": 166
  },
  "quality_checks": {
    "missing_age": 14952,
    "missing_country": 9,
    "missing_gender": 277,
    "users_with_degree_zero": 809
  },
  "summaries": {
    "degree": {
      "count": 76778.0,
      "mean": 10.15,
      "std": 22.696,
      "min": 0.0,
      "50%": 5.0,
      "90%": 22.0,
      "99%": 80.0,
      "max": 2013.0
    },
    "second_degree": {
      "count": 76778.0,
      "mean": 502.371,
      "std": 852.225,
      "min": 0.0,
      "50%": 166.0,
      "90%": 1542.0,
      "99%": 3949.23,
      "max": 23827.0
    },
    "shared_both_second_degree": {
      "count": 76778.0,
      "mean": 190.001,
      "std": 400.175,
      "min": 0.0,
      "50%": 43.0,
      "90%": 522.0,
      "99%": 1936.23,
      "max": 14253.0
    },
    "friend_country_match_rate_mean": 0.9988,
    "friend_age_group_match_rate_mean": 0.691
  },
  "insights": [
    "The cleaned graph contains 389,639 unique undirected friendships across 75,969 connected users.",
    "The median user has 5 direct friends but 166 second-degree candidates, which supports the core idea that the real opportunity lies beyond the first hop.",
    "Second-degree opportunity scales quickly: the 90th percentile user reaches 1,542 friends-of-friends after excluding direct ties.",
    "Attribute overlap remains meaningful in the second-degree layer: the median user has 43 second-degree candidates sharing both country and age group.",
    "The dataset is overwhelmingly UK-based, so country matching is informative for prototype logic but should not be over-interpreted as geographic diversity."
  ],
  "charts": {
    "age_group_distribution": [
      {
        "label": "10s",
        "value": 9984
      },
      {
        "label": "20s",
        "value": 40058
      },
      {
        "label": "30s",
        "value": 8609
      },
      {
        "label": "40s",
        "value": 2393
      },
      {
        "label": "50s",
        "value": 604
      },
      {
        "label": "60+",
        "value": 178
      },
      {
        "label": "unknown",
        "value": 14952
      }
    ],
    "top_countries": [
      {
        "label": "UK",
        "value": 76729
      },
      {
        "label": "UNKNOWN",
        "value": 9
      },
      {
        "label": "SE",
        "value": 5
      },
      {
        "label": "DE",
        "value": 5
      },
      {
        "label": "BR",
        "value": 4
      },
      {
        "label": "PL",
        "value": 4
      },
      {
        "label": "FR",
        "value": 3
      },
      {
        "label": "AU",
        "value": 3
      },
      {
        "label": "CA",
        "value": 2
      },
      {
        "label": "US",
        "value": 2
      }
    ],
    "degree_histogram": [
      {
        "label": "0-0",
        "value": 809
      },
      {
        "label": "1-2",
        "value": 20528
      },
      {
        "label": "3-4",
        "value": 14285
      },
      {
        "label": "5-9",
        "value": 19113
      },
      {
        "label": "10-19",
        "value": 12886
      },
      {
        "label": "20-49",
        "value": 7181
      },
      {
        "label": "50-99",
        "value": 1484
      },
      {
        "label": "100-249",
        "value": 424
      },
      {
        "label": "250-499",
        "value": 51
      },
      {
        "label": "500+",
        "value": 17
      }
    ],
    "second_degree_histogram": [
      {
        "label": "0-9",
        "value": 3551
      },
      {
        "label": "10-24",
        "value": 6019
      },
      {
        "label": "25-49",
        "value": 8422
      },
      {
        "label": "50-99",
        "value": 11422
      },
      {
        "label": "100-199",
        "value": 12161
      },
      {
        "label": "200-499",
        "value": 14516
      },
      {
        "label": "500-999",
        "value": 9194
      },
      {
        "label": "1000-1999",
        "value": 6197
      },
      {
        "label": "2000+",
        "value": 5296
      }
    ],
    "shared_attribute_histogram": [
      {
        "label": "0-0",
        "value": 16315
      },
      {
        "label": "1-2",
        "value": 1657
      },
      {
        "label": "3-4",
        "value": 1514
      },
      {
        "label": "5-9",
        "value": 3471
      },
      {
        "label": "10-19",
        "value": 5927
      },
      {
        "label": "20-49",
        "value": 11354
      },
      {
        "label": "50-99",
        "value": 9967
      },
      {
        "label": "100-199",
        "value": 8937
      },
      {
        "label": "200+",
        "value": 17636
      }
    ],
    "prototype_case_sizes": [
      {
        "label": "User 46455",
        "direct_friends": 11,
        "second_degree_count": 216,
        "same_country_second_degree": 215,
        "same_age_group_second_degree": 177,
        "same_both_second_degree": 176,
        "visible_second_degree_count": 16
      },
      {
        "label": "User 60013",
        "direct_friends": 14,
        "second_degree_count": 200,
        "same_country_second_degree": 200,
        "same_age_group_second_degree": 127,
        "same_both_second_degree": 127,
        "visible_second_degree_count": 16
      },
      {
        "label": "User 41599",
        "direct_friends": 15,
        "second_degree_count": 194,
        "same_country_second_degree": 194,
        "same_age_group_second_degree": 129,
        "same_both_second_degree": 129,
        "visible_second_degree_count": 16
      }
    ]
  },
  "prototype": {
    "supported_filters": [
      {
        "id": "same_country",
        "label": "Same country"
      },
      {
        "id": "same_age_group",
        "label": "Same age group"
      }
    ],
    "planned_filters": [
      {
        "id": "same_music_taste",
        "label": "Same music taste",
        "status": "planned",
        "note": "Needs a user-to-artist listening table, which is not present in the local workspace."
      }
    ],
    "cases": [
      {
        "user": {
          "id": 46455,
          "label": "User 46455",
          "ring": "root",
          "country": "UK",
          "age_group": "20s",
          "degree": 11
        },
        "summary": {
          "direct_friends": 11,
          "second_degree_count": 216,
          "visible_second_degree_count": 16,
          "same_country_second_degree": 215,
          "same_age_group_second_degree": 177,
          "same_both_second_degree": 176,
          "visible_same_country": 16,
          "visible_same_age_group": 15,
          "visible_same_both": 15
        },
        "nodes": [
          {
            "id": 46455,
            "label": "User 46455",
            "ring": "root",
            "country": "UK",
            "age_group": "20s",
            "degree": 11
          },
          {
            "id": 4801,
            "label": "User 4801",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 21
          },
          {
            "id": 5598,
            "label": "User 5598",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 6
          },
          {
            "id": 36663,
            "label": "User 36663",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 24
          },
          {
            "id": 38375,
            "label": "User 38375",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 5
          },
          {
            "id": 39835,
            "label": "User 39835",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 4
          },
          {
            "id": 46963,
            "label": "User 46963",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 18
          },
          {
            "id": 54423,
            "label": "User 54423",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 31
          },
          {
            "id": 59161,
            "label": "User 59161",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 4
          },
          {
            "id": 59703,
            "label": "User 59703",
            "ring": "first",
            "country": "UK",
            "age_group": null,
            "degree": 5
          },
          {
            "id": 60410,
            "label": "User 60410",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 81
          },
          {
            "id": 69346,
            "label": "User 69346",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 48
          },
          {
            "id": 67974,
            "label": "User 67974",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 24
          },
          {
            "id": 44702,
            "label": "User 44702",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 78
          },
          {
            "id": 26989,
            "label": "User 26989",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 12
          },
          {
            "id": 43687,
            "label": "User 43687",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 10
          },
          {
            "id": 73750,
            "label": "User 73750",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 6
          },
          {
            "id": 25682,
            "label": "User 25682",
            "ring": "second",
            "country": "UK",
            "age_group": null,
            "degree": 20
          },
          {
            "id": 51398,
            "label": "User 51398",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 1643
          },
          {
            "id": 3670,
            "label": "User 3670",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 310
          },
          {
            "id": 58786,
            "label": "User 58786",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 252
          },
          {
            "id": 3010,
            "label": "User 3010",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 234
          },
          {
            "id": 52851,
            "label": "User 52851",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 158
          },
          {
            "id": 14099,
            "label": "User 14099",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 153
          },
          {
            "id": 57896,
            "label": "User 57896",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 148
          },
          {
            "id": 35312,
            "label": "User 35312",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 147
          },
          {
            "id": 40902,
            "label": "User 40902",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 125
          },
          {
            "id": 12363,
            "label": "User 12363",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 118
          }
        ],
        "edges": [
          {
            "source": 46455,
            "target": 4801
          },
          {
            "source": 4801,
            "target": 67974
          },
          {
            "source": 46455,
            "target": 5598
          },
          {
            "source": 46455,
            "target": 36663
          },
          {
            "source": 36663,
            "target": 35312
          },
          {
            "source": 36663,
            "target": 44702
          },
          {
            "source": 36663,
            "target": 3670
          },
          {
            "source": 46455,
            "target": 38375
          },
          {
            "source": 38375,
            "target": 67974
          },
          {
            "source": 46455,
            "target": 39835
          },
          {
            "source": 39835,
            "target": 40902
          },
          {
            "source": 46455,
            "target": 46963
          },
          {
            "source": 46963,
            "target": 58786
          },
          {
            "source": 46963,
            "target": 43687
          },
          {
            "source": 46963,
            "target": 26989
          },
          {
            "source": 46963,
            "target": 25682
          },
          {
            "source": 46963,
            "target": 73750
          },
          {
            "source": 46455,
            "target": 54423
          },
          {
            "source": 54423,
            "target": 43687
          },
          {
            "source": 54423,
            "target": 26989
          },
          {
            "source": 54423,
            "target": 25682
          },
          {
            "source": 54423,
            "target": 73750
          },
          {
            "source": 54423,
            "target": 44702
          },
          {
            "source": 46455,
            "target": 59161
          },
          {
            "source": 46455,
            "target": 59703
          },
          {
            "source": 59703,
            "target": 67974
          },
          {
            "source": 46455,
            "target": 60410
          },
          {
            "source": 60410,
            "target": 57896
          },
          {
            "source": 60410,
            "target": 52851
          },
          {
            "source": 60410,
            "target": 12363
          },
          {
            "source": 46455,
            "target": 69346
          },
          {
            "source": 69346,
            "target": 3010
          },
          {
            "source": 69346,
            "target": 14099
          },
          {
            "source": 69346,
            "target": 51398
          },
          {
            "source": 69346,
            "target": 67974
          }
        ],
        "direct_friends": [
          {
            "id": 4801,
            "label": "User 4801",
            "country": "UK",
            "age_group": "20s",
            "degree": 21,
            "bridge_count": 1,
            "bridge_candidates": [
              67974
            ]
          },
          {
            "id": 5598,
            "label": "User 5598",
            "country": "UK",
            "age_group": "20s",
            "degree": 6,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 36663,
            "label": "User 36663",
            "country": "UK",
            "age_group": "20s",
            "degree": 24,
            "bridge_count": 3,
            "bridge_candidates": [
              3670,
              35312,
              44702
            ]
          },
          {
            "id": 38375,
            "label": "User 38375",
            "country": "UK",
            "age_group": "20s",
            "degree": 5,
            "bridge_count": 1,
            "bridge_candidates": [
              67974
            ]
          },
          {
            "id": 39835,
            "label": "User 39835",
            "country": "UK",
            "age_group": "20s",
            "degree": 4,
            "bridge_count": 1,
            "bridge_candidates": [
              40902
            ]
          },
          {
            "id": 46963,
            "label": "User 46963",
            "country": "UK",
            "age_group": "20s",
            "degree": 18,
            "bridge_count": 5,
            "bridge_candidates": [
              25682,
              26989,
              43687,
              58786,
              73750
            ]
          },
          {
            "id": 54423,
            "label": "User 54423",
            "country": "UK",
            "age_group": "20s",
            "degree": 31,
            "bridge_count": 5,
            "bridge_candidates": [
              25682,
              26989,
              43687,
              44702,
              73750
            ]
          },
          {
            "id": 59161,
            "label": "User 59161",
            "country": "UK",
            "age_group": "20s",
            "degree": 4,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 59703,
            "label": "User 59703",
            "country": "UK",
            "age_group": null,
            "degree": 5,
            "bridge_count": 1,
            "bridge_candidates": [
              67974
            ]
          },
          {
            "id": 60410,
            "label": "User 60410",
            "country": "UK",
            "age_group": "20s",
            "degree": 81,
            "bridge_count": 3,
            "bridge_candidates": [
              12363,
              52851,
              57896
            ]
          },
          {
            "id": 69346,
            "label": "User 69346",
            "country": "UK",
            "age_group": "20s",
            "degree": 48,
            "bridge_count": 4,
            "bridge_candidates": [
              3010,
              14099,
              51398,
              67974
            ]
          }
        ],
        "candidates": [
          {
            "id": 67974,
            "label": "User 67974",
            "country": "UK",
            "age_group": "20s",
            "degree": 24,
            "mutual_friends": 4,
            "mutual_friend_ids": [
              4801,
              38375,
              59703,
              69346
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 10
          },
          {
            "id": 44702,
            "label": "User 44702",
            "country": "UK",
            "age_group": "20s",
            "degree": 78,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              36663,
              54423
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 26989,
            "label": "User 26989",
            "country": "UK",
            "age_group": "20s",
            "degree": 12,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              46963,
              54423
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 43687,
            "label": "User 43687",
            "country": "UK",
            "age_group": "20s",
            "degree": 10,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              46963,
              54423
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 73750,
            "label": "User 73750",
            "country": "UK",
            "age_group": "20s",
            "degree": 6,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              46963,
              54423
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 25682,
            "label": "User 25682",
            "country": "UK",
            "age_group": null,
            "degree": 20,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              46963,
              54423
            ],
            "same_country": true,
            "same_age_group": false,
            "shared_attribute_count": 1,
            "score": 5
          },
          {
            "id": 51398,
            "label": "User 51398",
            "country": "UK",
            "age_group": "20s",
            "degree": 1643,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              69346
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 3670,
            "label": "User 3670",
            "country": "UK",
            "age_group": "20s",
            "degree": 310,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              36663
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 58786,
            "label": "User 58786",
            "country": "UK",
            "age_group": "20s",
            "degree": 252,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              46963
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 3010,
            "label": "User 3010",
            "country": "UK",
            "age_group": "20s",
            "degree": 234,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              69346
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 52851,
            "label": "User 52851",
            "country": "UK",
            "age_group": "20s",
            "degree": 158,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              60410
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 14099,
            "label": "User 14099",
            "country": "UK",
            "age_group": "20s",
            "degree": 153,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              69346
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 57896,
            "label": "User 57896",
            "country": "UK",
            "age_group": "20s",
            "degree": 148,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              60410
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 35312,
            "label": "User 35312",
            "country": "UK",
            "age_group": "20s",
            "degree": 147,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              36663
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 40902,
            "label": "User 40902",
            "country": "UK",
            "age_group": "20s",
            "degree": 125,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              39835
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 12363,
            "label": "User 12363",
            "country": "UK",
            "age_group": "20s",
            "degree": 118,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              60410
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          }
        ]
      },
      {
        "user": {
          "id": 60013,
          "label": "User 60013",
          "ring": "root",
          "country": "UK",
          "age_group": "10s",
          "degree": 14
        },
        "summary": {
          "direct_friends": 14,
          "second_degree_count": 200,
          "visible_second_degree_count": 16,
          "same_country_second_degree": 200,
          "same_age_group_second_degree": 127,
          "same_both_second_degree": 127,
          "visible_same_country": 16,
          "visible_same_age_group": 13,
          "visible_same_both": 13
        },
        "nodes": [
          {
            "id": 60013,
            "label": "User 60013",
            "ring": "root",
            "country": "UK",
            "age_group": "10s",
            "degree": 14
          },
          {
            "id": 2282,
            "label": "User 2282",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 10
          },
          {
            "id": 7780,
            "label": "User 7780",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 30
          },
          {
            "id": 9724,
            "label": "User 9724",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 87
          },
          {
            "id": 19744,
            "label": "User 19744",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 13
          },
          {
            "id": 19785,
            "label": "User 19785",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 19
          },
          {
            "id": 43690,
            "label": "User 43690",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 10
          },
          {
            "id": 43964,
            "label": "User 43964",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 21
          },
          {
            "id": 44506,
            "label": "User 44506",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 12
          },
          {
            "id": 44643,
            "label": "User 44643",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 9
          },
          {
            "id": 50313,
            "label": "User 50313",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 31
          },
          {
            "id": 50641,
            "label": "User 50641",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 7
          },
          {
            "id": 58345,
            "label": "User 58345",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 14
          },
          {
            "id": 61485,
            "label": "User 61485",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 8
          },
          {
            "id": 73125,
            "label": "User 73125",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 8
          },
          {
            "id": 10639,
            "label": "User 10639",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 199
          },
          {
            "id": 47859,
            "label": "User 47859",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 74
          },
          {
            "id": 45853,
            "label": "User 45853",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 22
          },
          {
            "id": 12367,
            "label": "User 12367",
            "ring": "second",
            "country": "UK",
            "age_group": "50s",
            "degree": 906
          },
          {
            "id": 17541,
            "label": "User 17541",
            "ring": "second",
            "country": "UK",
            "age_group": null,
            "degree": 30
          },
          {
            "id": 64321,
            "label": "User 64321",
            "ring": "second",
            "country": "UK",
            "age_group": null,
            "degree": 22
          },
          {
            "id": 19775,
            "label": "User 19775",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 76
          },
          {
            "id": 66775,
            "label": "User 66775",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 60
          },
          {
            "id": 12023,
            "label": "User 12023",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 58
          },
          {
            "id": 24043,
            "label": "User 24043",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 44
          },
          {
            "id": 48270,
            "label": "User 48270",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 34
          },
          {
            "id": 19137,
            "label": "User 19137",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 32
          },
          {
            "id": 20343,
            "label": "User 20343",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 22
          },
          {
            "id": 6969,
            "label": "User 6969",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 20
          },
          {
            "id": 19782,
            "label": "User 19782",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 20
          },
          {
            "id": 60880,
            "label": "User 60880",
            "ring": "second",
            "country": "UK",
            "age_group": "10s",
            "degree": 20
          }
        ],
        "edges": [
          {
            "source": 60013,
            "target": 2282
          },
          {
            "source": 60013,
            "target": 7780
          },
          {
            "source": 7780,
            "target": 19137
          },
          {
            "source": 7780,
            "target": 45853
          },
          {
            "source": 7780,
            "target": 12023
          },
          {
            "source": 60013,
            "target": 9724
          },
          {
            "source": 9724,
            "target": 64321
          },
          {
            "source": 9724,
            "target": 19137
          },
          {
            "source": 9724,
            "target": 17541
          },
          {
            "source": 9724,
            "target": 19782
          },
          {
            "source": 9724,
            "target": 24043
          },
          {
            "source": 9724,
            "target": 48270
          },
          {
            "source": 9724,
            "target": 12367
          },
          {
            "source": 9724,
            "target": 10639
          },
          {
            "source": 9724,
            "target": 60880
          },
          {
            "source": 9724,
            "target": 47859
          },
          {
            "source": 9724,
            "target": 20343
          },
          {
            "source": 9724,
            "target": 6969
          },
          {
            "source": 9724,
            "target": 66775
          },
          {
            "source": 9724,
            "target": 45853
          },
          {
            "source": 9724,
            "target": 19775
          },
          {
            "source": 60013,
            "target": 19744
          },
          {
            "source": 19744,
            "target": 12367
          },
          {
            "source": 19744,
            "target": 66775
          },
          {
            "source": 60013,
            "target": 19785
          },
          {
            "source": 19785,
            "target": 64321
          },
          {
            "source": 19785,
            "target": 24043
          },
          {
            "source": 19785,
            "target": 10639
          },
          {
            "source": 19785,
            "target": 12367
          },
          {
            "source": 19785,
            "target": 47859
          },
          {
            "source": 60013,
            "target": 43690
          },
          {
            "source": 60013,
            "target": 43964
          },
          {
            "source": 43964,
            "target": 17541
          },
          {
            "source": 43964,
            "target": 19775
          },
          {
            "source": 60013,
            "target": 44506
          },
          {
            "source": 60013,
            "target": 44643
          },
          {
            "source": 60013,
            "target": 50313
          },
          {
            "source": 50313,
            "target": 64321
          },
          {
            "source": 50313,
            "target": 19782
          },
          {
            "source": 50313,
            "target": 48270
          },
          {
            "source": 50313,
            "target": 10639
          },
          {
            "source": 50313,
            "target": 60880
          },
          {
            "source": 50313,
            "target": 47859
          },
          {
            "source": 50313,
            "target": 20343
          },
          {
            "source": 50313,
            "target": 6969
          },
          {
            "source": 60013,
            "target": 50641
          },
          {
            "source": 50641,
            "target": 17541
          },
          {
            "source": 60013,
            "target": 58345
          },
          {
            "source": 58345,
            "target": 45853
          },
          {
            "source": 58345,
            "target": 10639
          },
          {
            "source": 60013,
            "target": 61485
          },
          {
            "source": 61485,
            "target": 10639
          },
          {
            "source": 60013,
            "target": 73125
          },
          {
            "source": 73125,
            "target": 12023
          }
        ],
        "direct_friends": [
          {
            "id": 2282,
            "label": "User 2282",
            "country": "UK",
            "age_group": "10s",
            "degree": 10,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 7780,
            "label": "User 7780",
            "country": "UK",
            "age_group": "10s",
            "degree": 30,
            "bridge_count": 3,
            "bridge_candidates": [
              12023,
              19137,
              45853
            ]
          },
          {
            "id": 9724,
            "label": "User 9724",
            "country": "UK",
            "age_group": "10s",
            "degree": 87,
            "bridge_count": 15,
            "bridge_candidates": [
              6969,
              10639,
              12367,
              17541,
              19137,
              19775,
              19782,
              20343,
              24043,
              45853,
              47859,
              48270,
              60880,
              64321,
              66775
            ]
          },
          {
            "id": 19744,
            "label": "User 19744",
            "country": "UK",
            "age_group": "10s",
            "degree": 13,
            "bridge_count": 2,
            "bridge_candidates": [
              12367,
              66775
            ]
          },
          {
            "id": 19785,
            "label": "User 19785",
            "country": "UK",
            "age_group": "10s",
            "degree": 19,
            "bridge_count": 5,
            "bridge_candidates": [
              10639,
              12367,
              24043,
              47859,
              64321
            ]
          },
          {
            "id": 43690,
            "label": "User 43690",
            "country": "UK",
            "age_group": "10s",
            "degree": 10,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 43964,
            "label": "User 43964",
            "country": "UK",
            "age_group": "10s",
            "degree": 21,
            "bridge_count": 2,
            "bridge_candidates": [
              17541,
              19775
            ]
          },
          {
            "id": 44506,
            "label": "User 44506",
            "country": "UK",
            "age_group": "10s",
            "degree": 12,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 44643,
            "label": "User 44643",
            "country": "UK",
            "age_group": "10s",
            "degree": 9,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 50313,
            "label": "User 50313",
            "country": "UK",
            "age_group": "20s",
            "degree": 31,
            "bridge_count": 8,
            "bridge_candidates": [
              6969,
              10639,
              19782,
              20343,
              47859,
              48270,
              60880,
              64321
            ]
          },
          {
            "id": 50641,
            "label": "User 50641",
            "country": "UK",
            "age_group": "20s",
            "degree": 7,
            "bridge_count": 1,
            "bridge_candidates": [
              17541
            ]
          },
          {
            "id": 58345,
            "label": "User 58345",
            "country": "UK",
            "age_group": "10s",
            "degree": 14,
            "bridge_count": 2,
            "bridge_candidates": [
              10639,
              45853
            ]
          },
          {
            "id": 61485,
            "label": "User 61485",
            "country": "UK",
            "age_group": "10s",
            "degree": 8,
            "bridge_count": 1,
            "bridge_candidates": [
              10639
            ]
          },
          {
            "id": 73125,
            "label": "User 73125",
            "country": "UK",
            "age_group": "10s",
            "degree": 8,
            "bridge_count": 1,
            "bridge_candidates": [
              12023
            ]
          }
        ],
        "candidates": [
          {
            "id": 10639,
            "label": "User 10639",
            "country": "UK",
            "age_group": "10s",
            "degree": 199,
            "mutual_friends": 5,
            "mutual_friend_ids": [
              9724,
              19785,
              50313,
              58345,
              61485
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 12
          },
          {
            "id": 47859,
            "label": "User 47859",
            "country": "UK",
            "age_group": "10s",
            "degree": 74,
            "mutual_friends": 3,
            "mutual_friend_ids": [
              9724,
              19785,
              50313
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 8
          },
          {
            "id": 45853,
            "label": "User 45853",
            "country": "UK",
            "age_group": "10s",
            "degree": 22,
            "mutual_friends": 3,
            "mutual_friend_ids": [
              7780,
              9724,
              58345
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 8
          },
          {
            "id": 12367,
            "label": "User 12367",
            "country": "UK",
            "age_group": "50s",
            "degree": 906,
            "mutual_friends": 3,
            "mutual_friend_ids": [
              9724,
              19744,
              19785
            ],
            "same_country": true,
            "same_age_group": false,
            "shared_attribute_count": 1,
            "score": 7
          },
          {
            "id": 17541,
            "label": "User 17541",
            "country": "UK",
            "age_group": null,
            "degree": 30,
            "mutual_friends": 3,
            "mutual_friend_ids": [
              9724,
              43964,
              50641
            ],
            "same_country": true,
            "same_age_group": false,
            "shared_attribute_count": 1,
            "score": 7
          },
          {
            "id": 64321,
            "label": "User 64321",
            "country": "UK",
            "age_group": null,
            "degree": 22,
            "mutual_friends": 3,
            "mutual_friend_ids": [
              9724,
              19785,
              50313
            ],
            "same_country": true,
            "same_age_group": false,
            "shared_attribute_count": 1,
            "score": 7
          },
          {
            "id": 19775,
            "label": "User 19775",
            "country": "UK",
            "age_group": "10s",
            "degree": 76,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              43964
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 66775,
            "label": "User 66775",
            "country": "UK",
            "age_group": "10s",
            "degree": 60,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              19744
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 12023,
            "label": "User 12023",
            "country": "UK",
            "age_group": "10s",
            "degree": 58,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              7780,
              73125
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 24043,
            "label": "User 24043",
            "country": "UK",
            "age_group": "10s",
            "degree": 44,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              19785
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 48270,
            "label": "User 48270",
            "country": "UK",
            "age_group": "10s",
            "degree": 34,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              50313
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 19137,
            "label": "User 19137",
            "country": "UK",
            "age_group": "10s",
            "degree": 32,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              7780,
              9724
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 20343,
            "label": "User 20343",
            "country": "UK",
            "age_group": "10s",
            "degree": 22,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              50313
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 6969,
            "label": "User 6969",
            "country": "UK",
            "age_group": "10s",
            "degree": 20,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              50313
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 19782,
            "label": "User 19782",
            "country": "UK",
            "age_group": "10s",
            "degree": 20,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              50313
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 60880,
            "label": "User 60880",
            "country": "UK",
            "age_group": "10s",
            "degree": 20,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              9724,
              50313
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          }
        ]
      },
      {
        "user": {
          "id": 41599,
          "label": "User 41599",
          "ring": "root",
          "country": "UK",
          "age_group": "20s",
          "degree": 15
        },
        "summary": {
          "direct_friends": 15,
          "second_degree_count": 194,
          "visible_second_degree_count": 16,
          "same_country_second_degree": 194,
          "same_age_group_second_degree": 129,
          "same_both_second_degree": 129,
          "visible_same_country": 16,
          "visible_same_age_group": 16,
          "visible_same_both": 16
        },
        "nodes": [
          {
            "id": 41599,
            "label": "User 41599",
            "ring": "root",
            "country": "UK",
            "age_group": "20s",
            "degree": 15
          },
          {
            "id": 1510,
            "label": "User 1510",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 34
          },
          {
            "id": 2392,
            "label": "User 2392",
            "ring": "first",
            "country": "UK",
            "age_group": "10s",
            "degree": 4
          },
          {
            "id": 5454,
            "label": "User 5454",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 7
          },
          {
            "id": 10337,
            "label": "User 10337",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 1
          },
          {
            "id": 13156,
            "label": "User 13156",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 31
          },
          {
            "id": 17077,
            "label": "User 17077",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 8
          },
          {
            "id": 21649,
            "label": "User 21649",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 12
          },
          {
            "id": 22826,
            "label": "User 22826",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 5
          },
          {
            "id": 39595,
            "label": "User 39595",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 13
          },
          {
            "id": 51077,
            "label": "User 51077",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 33
          },
          {
            "id": 55373,
            "label": "User 55373",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 34
          },
          {
            "id": 68132,
            "label": "User 68132",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 8
          },
          {
            "id": 68439,
            "label": "User 68439",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 24
          },
          {
            "id": 69152,
            "label": "User 69152",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 13
          },
          {
            "id": 75386,
            "label": "User 75386",
            "ring": "first",
            "country": "UK",
            "age_group": "20s",
            "degree": 3
          },
          {
            "id": 67881,
            "label": "User 67881",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 38
          },
          {
            "id": 18614,
            "label": "User 18614",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 24
          },
          {
            "id": 10616,
            "label": "User 10616",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 12
          },
          {
            "id": 46753,
            "label": "User 46753",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 9
          },
          {
            "id": 25967,
            "label": "User 25967",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 9
          },
          {
            "id": 57313,
            "label": "User 57313",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 9
          },
          {
            "id": 71631,
            "label": "User 71631",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 8
          },
          {
            "id": 34528,
            "label": "User 34528",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 7
          },
          {
            "id": 50146,
            "label": "User 50146",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 6
          },
          {
            "id": 40593,
            "label": "User 40593",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 244
          },
          {
            "id": 16767,
            "label": "User 16767",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 149
          },
          {
            "id": 4686,
            "label": "User 4686",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 126
          },
          {
            "id": 7942,
            "label": "User 7942",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 115
          },
          {
            "id": 18521,
            "label": "User 18521",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 97
          },
          {
            "id": 73265,
            "label": "User 73265",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 91
          },
          {
            "id": 50858,
            "label": "User 50858",
            "ring": "second",
            "country": "UK",
            "age_group": "20s",
            "degree": 86
          }
        ],
        "edges": [
          {
            "source": 41599,
            "target": 1510
          },
          {
            "source": 1510,
            "target": 46753
          },
          {
            "source": 1510,
            "target": 57313
          },
          {
            "source": 1510,
            "target": 71631
          },
          {
            "source": 1510,
            "target": 25967
          },
          {
            "source": 1510,
            "target": 10616
          },
          {
            "source": 1510,
            "target": 18521
          },
          {
            "source": 41599,
            "target": 2392
          },
          {
            "source": 41599,
            "target": 5454
          },
          {
            "source": 41599,
            "target": 10337
          },
          {
            "source": 41599,
            "target": 13156
          },
          {
            "source": 13156,
            "target": 67881
          },
          {
            "source": 13156,
            "target": 50858
          },
          {
            "source": 41599,
            "target": 17077
          },
          {
            "source": 41599,
            "target": 21649
          },
          {
            "source": 21649,
            "target": 57313
          },
          {
            "source": 21649,
            "target": 71631
          },
          {
            "source": 21649,
            "target": 46753
          },
          {
            "source": 21649,
            "target": 25967
          },
          {
            "source": 41599,
            "target": 22826
          },
          {
            "source": 22826,
            "target": 7942
          },
          {
            "source": 41599,
            "target": 39595
          },
          {
            "source": 39595,
            "target": 40593
          },
          {
            "source": 39595,
            "target": 4686
          },
          {
            "source": 41599,
            "target": 51077
          },
          {
            "source": 51077,
            "target": 16767
          },
          {
            "source": 41599,
            "target": 55373
          },
          {
            "source": 55373,
            "target": 34528
          },
          {
            "source": 55373,
            "target": 73265
          },
          {
            "source": 55373,
            "target": 50146
          },
          {
            "source": 55373,
            "target": 18614
          },
          {
            "source": 41599,
            "target": 68132
          },
          {
            "source": 68132,
            "target": 34528
          },
          {
            "source": 68132,
            "target": 50146
          },
          {
            "source": 68132,
            "target": 18614
          },
          {
            "source": 41599,
            "target": 68439
          },
          {
            "source": 68439,
            "target": 10616
          },
          {
            "source": 68439,
            "target": 67881
          },
          {
            "source": 41599,
            "target": 69152
          },
          {
            "source": 41599,
            "target": 75386
          }
        ],
        "direct_friends": [
          {
            "id": 1510,
            "label": "User 1510",
            "country": "UK",
            "age_group": "20s",
            "degree": 34,
            "bridge_count": 6,
            "bridge_candidates": [
              10616,
              18521,
              25967,
              46753,
              57313,
              71631
            ]
          },
          {
            "id": 2392,
            "label": "User 2392",
            "country": "UK",
            "age_group": "10s",
            "degree": 4,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 5454,
            "label": "User 5454",
            "country": "UK",
            "age_group": "20s",
            "degree": 7,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 10337,
            "label": "User 10337",
            "country": "UK",
            "age_group": "20s",
            "degree": 1,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 13156,
            "label": "User 13156",
            "country": "UK",
            "age_group": "20s",
            "degree": 31,
            "bridge_count": 2,
            "bridge_candidates": [
              50858,
              67881
            ]
          },
          {
            "id": 17077,
            "label": "User 17077",
            "country": "UK",
            "age_group": "20s",
            "degree": 8,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 21649,
            "label": "User 21649",
            "country": "UK",
            "age_group": "20s",
            "degree": 12,
            "bridge_count": 4,
            "bridge_candidates": [
              25967,
              46753,
              57313,
              71631
            ]
          },
          {
            "id": 22826,
            "label": "User 22826",
            "country": "UK",
            "age_group": "20s",
            "degree": 5,
            "bridge_count": 1,
            "bridge_candidates": [
              7942
            ]
          },
          {
            "id": 39595,
            "label": "User 39595",
            "country": "UK",
            "age_group": "20s",
            "degree": 13,
            "bridge_count": 2,
            "bridge_candidates": [
              4686,
              40593
            ]
          },
          {
            "id": 51077,
            "label": "User 51077",
            "country": "UK",
            "age_group": "20s",
            "degree": 33,
            "bridge_count": 1,
            "bridge_candidates": [
              16767
            ]
          },
          {
            "id": 55373,
            "label": "User 55373",
            "country": "UK",
            "age_group": "20s",
            "degree": 34,
            "bridge_count": 4,
            "bridge_candidates": [
              18614,
              34528,
              50146,
              73265
            ]
          },
          {
            "id": 68132,
            "label": "User 68132",
            "country": "UK",
            "age_group": "20s",
            "degree": 8,
            "bridge_count": 3,
            "bridge_candidates": [
              18614,
              34528,
              50146
            ]
          },
          {
            "id": 68439,
            "label": "User 68439",
            "country": "UK",
            "age_group": "20s",
            "degree": 24,
            "bridge_count": 2,
            "bridge_candidates": [
              10616,
              67881
            ]
          },
          {
            "id": 69152,
            "label": "User 69152",
            "country": "UK",
            "age_group": "20s",
            "degree": 13,
            "bridge_count": 0,
            "bridge_candidates": []
          },
          {
            "id": 75386,
            "label": "User 75386",
            "country": "UK",
            "age_group": "20s",
            "degree": 3,
            "bridge_count": 0,
            "bridge_candidates": []
          }
        ],
        "candidates": [
          {
            "id": 67881,
            "label": "User 67881",
            "country": "UK",
            "age_group": "20s",
            "degree": 38,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              13156,
              68439
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 18614,
            "label": "User 18614",
            "country": "UK",
            "age_group": "20s",
            "degree": 24,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              55373,
              68132
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 10616,
            "label": "User 10616",
            "country": "UK",
            "age_group": "20s",
            "degree": 12,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              1510,
              68439
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 46753,
            "label": "User 46753",
            "country": "UK",
            "age_group": "20s",
            "degree": 9,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              1510,
              21649
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 25967,
            "label": "User 25967",
            "country": "UK",
            "age_group": "20s",
            "degree": 9,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              1510,
              21649
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 57313,
            "label": "User 57313",
            "country": "UK",
            "age_group": "20s",
            "degree": 9,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              1510,
              21649
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 71631,
            "label": "User 71631",
            "country": "UK",
            "age_group": "20s",
            "degree": 8,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              1510,
              21649
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 34528,
            "label": "User 34528",
            "country": "UK",
            "age_group": "20s",
            "degree": 7,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              55373,
              68132
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 50146,
            "label": "User 50146",
            "country": "UK",
            "age_group": "20s",
            "degree": 6,
            "mutual_friends": 2,
            "mutual_friend_ids": [
              55373,
              68132
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 6
          },
          {
            "id": 40593,
            "label": "User 40593",
            "country": "UK",
            "age_group": "20s",
            "degree": 244,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              39595
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 16767,
            "label": "User 16767",
            "country": "UK",
            "age_group": "20s",
            "degree": 149,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              51077
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 4686,
            "label": "User 4686",
            "country": "UK",
            "age_group": "20s",
            "degree": 126,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              39595
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 7942,
            "label": "User 7942",
            "country": "UK",
            "age_group": "20s",
            "degree": 115,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              22826
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 18521,
            "label": "User 18521",
            "country": "UK",
            "age_group": "20s",
            "degree": 97,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              1510
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 73265,
            "label": "User 73265",
            "country": "UK",
            "age_group": "20s",
            "degree": 91,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              55373
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          },
          {
            "id": 50858,
            "label": "User 50858",
            "country": "UK",
            "age_group": "20s",
            "degree": 86,
            "mutual_friends": 1,
            "mutual_friend_ids": [
              13156
            ],
            "same_country": true,
            "same_age_group": true,
            "shared_attribute_count": 2,
            "score": 4
          }
        ]
      }
    ]
  }
};
