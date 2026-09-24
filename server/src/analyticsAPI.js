/**
 * Get reporting and analytics data for administrators.
 *
 * This route provides aggregated statistics for the Admin Reporting
 * and Analytics page.
 *
 * Administrators can filter reporting data by:
 * - Date range
 * - Campus
 * - Issue status
 * - Issue priority
 * - Reporting user type
 *
 * Time-based reporting can be grouped by:
 * - Day
 * - Week
 * - Month
 *
 * The route provides:
 * - Total issues
 * - Issues by status
 * - Issues by campus
 * - Issues by priority
 * - Issues over time
 * - Issues solved over time
 * - Average resolution time
 * - Unresolved issues by age
 * - Issues requiring attention
 *
 * Author/s: Amanda Foxley
 * Date created: 23/09/26
 */

import express from "express";

const router = express.Router();

/**
 * Admin reporting and analytics endpoint.
 */
router.get("/:firebaseUid", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { firebaseUid } = req.params;

        const {
            startDate,
            endDate,
            campus,
            status,
            priority,
            role,
            groupBy = "day"
        } = req.query;

        // Make sure the database is available.
        if (!db) {
            return res.status(500).json({
                error: "Database connection unavailable"
            });
        }

        // Find the user making the request.
        const user = await db.collection("User").findOne({
            firebaseUid
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Only administrators can access reporting and analytics.
        if (!user.isAdmin) {
            return res.status(403).json({
                error: "Administrator access required"
            });
        }

        // Validate time grouping.
        const validGroupings = [
            "day",
            "week",
            "month"
        ];

        if (!validGroupings.includes(groupBy)) {
            return res.status(400).json({
                error: "Invalid groupBy. Use day, week or month."
            });
        }

        // Validate campus filter.
        const validCampuses = [
            "Callaghan",
            "Ourimbah",
            "Newcastle City",
            "Gosford Hospital",
            "Gosford Mann Street",
            "Sydney",
            "Port Macquarie"
        ];

        if (
            campus &&
            campus !== "All" &&
            !validCampuses.includes(campus)
        ) {
            return res.status(400).json({
                error: "Invalid campus"
            });
        }

        // Validate status filter.
        const validStatuses = [
            "Open",
            "In Progress",
            "Closed"
        ];

        if (
            status &&
            status !== "All" &&
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                error: "Invalid status"
            });
        }

        // Validate priority filter.
        const validPriorities = [
            "Low",
            "Medium",
            "High",
            "Critical"
        ];

        if (
            priority &&
            priority !== "All" &&
            !validPriorities.includes(priority)
        ) {
            return res.status(400).json({
                error: "Invalid priority"
            });
        }

        // Validate reporting user role.
        const validRoles = [
            "Student",
            "Staff",
            "Visitor",
            "Contractor"
        ];

        if (
            role &&
            role !== "All" &&
            !validRoles.includes(role)
        ) {
            return res.status(400).json({
                error: "Invalid user type"
            });
        }

        /*
         * Build the date filter.
         *
         * The date range is interpreted using the local
         * calendar dates supplied by the administrator.
         */
        const dateFilter = {};

        if (startDate) {
            const parsedStartDate =
                new Date(`${startDate}T00:00:00`);

            if (
                Number.isNaN(
                    parsedStartDate.getTime()
                )
            ) {
                return res.status(400).json({
                    error: "Invalid startDate"
                });
            }

            dateFilter.$gte = parsedStartDate;
        }

        if (endDate) {
            const parsedEndDate =
                new Date(`${endDate}T23:59:59.999`);

            if (
                Number.isNaN(
                    parsedEndDate.getTime()
                )
            ) {
                return res.status(400).json({
                    error: "Invalid endDate"
                });
            }

            dateFilter.$lte = parsedEndDate;
        }

        // Make sure the start date is not later than the end date.
        if (
            dateFilter.$gte &&
            dateFilter.$lte &&
            dateFilter.$gte > dateFilter.$lte
        ) {
            return res.status(400).json({
                error: "startDate cannot be later than endDate"
            });
        }

        /*
         * Build the base Issue filters.
         *
         * The date filter is deliberately NOT included here.
         *
         * Different analytics use different dates:
         *
         * - General reporting uses dateTimeReported.
         * - Issues solved over time uses dateTimeIssueClosed.
         *
         * The remaining filters are shared across the
         * analytics because they describe the issue itself
         * or the reporting user.
         */
        const issueQuery = {};

        if (
            campus &&
            campus !== "All"
        ) {
            issueQuery.campus = campus;
        }

        if (
            status &&
            status !== "All"
        ) {
            issueQuery.status = status;
        }

        if (
            priority &&
            priority !== "All"
        ) {
            issueQuery.priority = priority;
        }

        /*
         * Date filter for analytics based on when
         * an issue was reported.
         *
         * If no date filter was supplied, this is an
         * empty match and therefore does not restrict
         * the results.
         */
        const reportDateMatch =
            Object.keys(dateFilter).length > 0
                ? {
                    dateTimeReported: dateFilter
                }
                : {};

        /*
         * Common aggregation pipeline.
         *
         * The User lookup is required because the reporting
         * user's role is stored in the User collection.
         *
         * All facets below inherit the issue filters and
         * reporting-user role filter from this pipeline.
         */
        const analyticsPipeline = [
            {
                $match: issueQuery
            },

            {
                $lookup: {
                    from: "User",
                    localField: "reportedBy",
                    foreignField: "_id",
                    as: "reportingUser"
                }
            },

            {
                $unwind: {
                    path: "$reportingUser",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        /*
         * Apply the reporting user type filter after
         * looking up the User document.
         */
        if (
            role &&
            role !== "All"
        ) {
            analyticsPipeline.push({
                $match: {
                    "reportingUser.role": role
                }
            });
        }

        /*
         * Build the time grouping expression for
         * issues reported over time.
         *
         * All dates are grouped using the Sydney timezone.
         */
        let timeGroupExpression;

        if (groupBy === "day") {
            timeGroupExpression = {
                $dateTrunc: {
                    date: "$dateTimeReported",
                    unit: "day",
                    timezone: "Australia/Sydney"
                }
            };
        }

        if (groupBy === "week") {
            timeGroupExpression = {
                $dateTrunc: {
                    date: "$dateTimeReported",
                    unit: "week",
                    binSize: 1,
                    timezone: "Australia/Sydney",
                    startOfWeek: "monday"
                }
            };
        }

        if (groupBy === "month") {
            timeGroupExpression = {
                $dateTrunc: {
                    date: "$dateTimeReported",
                    unit: "month",
                    timezone: "Australia/Sydney"
                }
            };
        }

        /*
         * Build a separate time grouping expression for
         * issues solved over time.
         *
         * This uses dateTimeIssueClosed rather than
         * dateTimeReported so the chart represents
         * when issues were actually closed.
         */
        let solvedTimeGroupExpression;

        if (groupBy === "day") {
            solvedTimeGroupExpression = {
                $dateTrunc: {
                    date: "$dateTimeIssueClosed",
                    unit: "day",
                    timezone: "Australia/Sydney"
                }
            };
        }

        if (groupBy === "week") {
            solvedTimeGroupExpression = {
                $dateTrunc: {
                    date: "$dateTimeIssueClosed",
                    unit: "week",
                    binSize: 1,
                    timezone: "Australia/Sydney",
                    startOfWeek: "monday"
                }
            };
        }

        if (groupBy === "month") {
            solvedTimeGroupExpression = {
                $dateTrunc: {
                    date: "$dateTimeIssueClosed",
                    unit: "month",
                    timezone: "Australia/Sydney"
                }
            };
        }

        /*
         * Calculate all analytics.
         *
         * General analytics use dateTimeReported.
         * Issues solved over time uses dateTimeIssueClosed.
         *
         * All issue-level filters and the optional reporting
         * user role filter have already been applied before
         * the $facet stage.
         */
        analyticsPipeline.push({
            $facet: {

                /* =========================
                   SUMMARY STATISTICS
                   ========================= */

                summary: [
                    {
                        $match: reportDateMatch
                    },

                    {
                        $group: {
                            _id: null,

                            total: {
                                $sum: 1
                            },

                            open: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$status",
                                                "Open"
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },

                            inProgress: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$status",
                                                "In Progress"
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },

                            closed: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$status",
                                                "Closed"
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },

                            unassigned: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$assignedTo",
                                                        null
                                                    ]
                                                },
                                                {
                                                    $in: [
                                                        "$status",
                                                        [
                                                            "Open",
                                                            "In Progress"
                                                        ]
                                                    ]
                                                }
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },

                            resolutionTimeTotal: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$status",
                                                        "Closed"
                                                    ]
                                                },
                                                {
                                                    $ne: [
                                                        "$dateTimeReported",
                                                        null
                                                    ]
                                                },
                                                {
                                                    $ne: [
                                                        "$dateTimeIssueClosed",
                                                        null
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            $subtract: [
                                                "$dateTimeIssueClosed",
                                                "$dateTimeReported"
                                            ]
                                        },
                                        0
                                    ]
                                }
                            },

                            resolutionCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $eq: [
                                                        "$status",
                                                        "Closed"
                                                    ]
                                                },
                                                {
                                                    $ne: [
                                                        "$dateTimeReported",
                                                        null
                                                    ]
                                                },
                                                {
                                                    $ne: [
                                                        "$dateTimeIssueClosed",
                                                        null
                                                    ]
                                                }
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],

                /* =========================
                   ISSUES BY STATUS
                   ========================= */

                reportsByStatus: [
                    {
                        $match: reportDateMatch
                    },

                    {
                        $group: {
                            _id: "$status",

                            count: {
                                $sum: 1
                            }
                        }
                    },

                    {
                        $sort: {
                            count: -1
                        }
                    }
                ],

                /* =========================
                   ISSUES BY CAMPUS
                   ========================= */

                reportsByCampus: [
                    {
                        $match: reportDateMatch
                    },

                    {
                        $group: {
                            _id: "$campus",

                            count: {
                                $sum: 1
                            }
                        }
                    },

                    {
                        $sort: {
                            count: -1
                        }
                    }
                ],

                /* =========================
    ISSUES BY PRIORITY
    ========================= */

                reportsByPriority: [
                    {
                        $match: reportDateMatch
                    },

                    {
                        $group: {
                            _id: "$priority",

                            count: {
                                $sum: 1
                            }
                        }
                    },

                    /*
                     * Order priorities from highest to lowest.
                     */
                    {
                        $addFields: {
                            sortOrder: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "Critical"
                                                ]
                                            },
                                            then: 1
                                        },
                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "High"
                                                ]
                                            },
                                            then: 2
                                        },
                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "Medium"
                                                ]
                                            },
                                            then: 3
                                        },
                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "Low"
                                                ]
                                            },
                                            then: 4
                                        }
                                    ],

                                    default: 99
                                }
                            }
                        }
                    },

                    {
                        $sort: {
                            sortOrder: 1
                        }
                    }
                ],

                /* =========================
                   REPORTED ISSUES OVER TIME
                   ========================= */

                reportsOverTime: [
                    {
                        $match: {
                            ...reportDateMatch,

                            dateTimeReported: {
                                ...dateFilter,
                                $ne: null
                            }
                        }
                    },

                    {
                        $group: {
                            _id: timeGroupExpression,

                            count: {
                                $sum: 1
                            }
                        }
                    },

                    {
                        $sort: {
                            _id: 1
                        }
                    }
                ],

                /* =========================
                   ISSUES SOLVED OVER TIME
                   ========================= */

                issuesSolvedOverTime: [
                    {
                        $match: {
                            status: "Closed",

                            dateTimeIssueClosed: {
                                ...dateFilter,
                                $ne: null
                            }
                        }
                    },

                    {
                        $group: {
                            _id: solvedTimeGroupExpression,

                            count: {
                                $sum: 1
                            }
                        }
                    },

                    {
                        $sort: {
                            _id: 1
                        }
                    }
                ],

                /* =========================
                   UNRESOLVED ISSUE AGE
                   ========================= */

                unresolvedIssuesByAge: [
                    {
                        $match: {
                            ...reportDateMatch,

                            status: {
                                $in: [
                                    "Open",
                                    "In Progress"
                                ]
                            },

                            dateTimeReported: {
                                ...dateFilter,
                                $ne: null
                            }
                        }
                    },

                    /*
                     * Calculate how many complete days the issue
                     * has remained unresolved.
                     */
                    {
                        $addFields: {
                            ageDays: {
                                $floor: {
                                    $divide: [
                                        {
                                            $subtract: [
                                                "$$NOW",
                                                "$dateTimeReported"
                                            ]
                                        },
                                        1000 * 60 * 60 * 24
                                    ]
                                }
                            }
                        }
                    },

                    /*
                     * Place each unresolved issue into an age bracket.
                     */
                    {
                        $addFields: {
                            ageGroup: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $lte: [
                                                    "$ageDays",
                                                    7
                                                ]
                                            },
                                            then: "0–7 days"
                                        },

                                        {
                                            case: {
                                                $lte: [
                                                    "$ageDays",
                                                    14
                                                ]
                                            },
                                            then: "8–14 days"
                                        },

                                        {
                                            case: {
                                                $lte: [
                                                    "$ageDays",
                                                    30
                                                ]
                                            },
                                            then: "15–30 days"
                                        },

                                        {
                                            case: {
                                                $lte: [
                                                    "$ageDays",
                                                    60
                                                ]
                                            },
                                            then: "31–60 days"
                                        }
                                    ],

                                    default: "60+ days"
                                }
                            }
                        }
                    },

                    /*
                     * Count the number of issues in each age bracket.
                     */
                    {
                        $group: {
                            _id: "$ageGroup",

                            count: {
                                $sum: 1
                            }
                        }
                    },

                    /*
                     * Convert the age bracket into a numeric sort order.
                     */
                    {
                        $addFields: {
                            sortOrder: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "0–7 days"
                                                ]
                                            },
                                            then: 1
                                        },

                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "8–14 days"
                                                ]
                                            },
                                            then: 2
                                        },

                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "15–30 days"
                                                ]
                                            },
                                            then: 3
                                        },

                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "31–60 days"
                                                ]
                                            },
                                            then: 4
                                        },

                                        {
                                            case: {
                                                $eq: [
                                                    "$_id",
                                                    "60+ days"
                                                ]
                                            },
                                            then: 5
                                        }
                                    ],

                                    default: 99
                                }
                            }
                        }
                    },

                    {
                        $sort: {
                            sortOrder: 1
                        }
                    }
                ],

                /* =========================
                   ISSUES REQUIRING ATTENTION
                   ========================= */

                issuesRequiringAttention: [
                    {
                        $match: {
                            ...reportDateMatch,

                            status: {
                                $in: [
                                    "Open",
                                    "In Progress"
                                ]
                            },

                            dateTimeReported: {
                                ...dateFilter,
                                $ne: null
                            }
                        }
                    },

                    /*
                     * Calculate how many complete days each issue
                     * has remained unresolved.
                     */
                    {
                        $addFields: {
                            ageDays: {
                                $floor: {
                                    $divide: [
                                        {
                                            $subtract: [
                                                "$$NOW",
                                                "$dateTimeReported"
                                            ]
                                        },
                                        1000 * 60 * 60 * 24
                                    ]
                                }
                            }
                        }
                    },

                    /*
                     * Look up the administrator/staff member assigned
                     * to the issue so the frontend can display their name.
                     */
                    {
                        $lookup: {
                            from: "User",
                            localField: "assignedTo",
                            foreignField: "_id",
                            as: "assignedUser"
                        }
                    },

                    {
                        $unwind: {
                            path: "$assignedUser",
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    /*
                     * Sort oldest reported issues first.
                     */
                    {
                        $sort: {
                            dateTimeReported: 1
                        }
                    },

                    /*
                     * Only return the five oldest unresolved issues.
                     */
                    {
                        $limit: 5
                    },

                    {
                        $project: {
                            _id: 0,

                            issueId: {
                                $toString: "$_id"
                            },

                            title: 1,
                            location: 1,
                            campus: 1,
                            dateTimeReported: 1,
                            status: 1,
                            priority: 1,
                            ageDays: 1,

                            /*
                             * Return the assigned user's name.
                             */
                            assignedToName: {
                                $cond: [
                                    {
                                        $ne: [
                                            "$assignedUser",
                                            null
                                        ]
                                    },
                                    {
                                        $concat: [
                                            {
                                                $ifNull: [
                                                    "$assignedUser.firstName",
                                                    ""
                                                ]
                                            },
                                            " ",
                                            {
                                                $ifNull: [
                                                    "$assignedUser.lastName",
                                                    ""
                                                ]
                                            }
                                        ]
                                    },
                                    null
                                ]
                            }
                        }
                    }
                ]
            }
        });

        const [analyticsResult] =
            await db
                .collection("Issue")
                .aggregate(analyticsPipeline)
                .toArray();

        /* =========================
           SUMMARY
           ========================= */

        const summaryData =
            analyticsResult.summary[0] || {
                total: 0,
                open: 0,
                inProgress: 0,
                closed: 0,
                unassigned: 0,
                resolutionTimeTotal: 0,
                resolutionCount: 0
            };

        /*
         * Calculate average resolution time in days.
         */
        const averageResolutionTimeDays =
            summaryData.resolutionCount > 0
                ? summaryData.resolutionTimeTotal /
                summaryData.resolutionCount /
                (1000 * 60 * 60 * 24)
                : 0;

        /* =========================
           RETURN DATA
           ========================= */

        res.json({
            stats: {
                total:
                    summaryData.total,

                open:
                    summaryData.open,

                inProgress:
                    summaryData.inProgress,

                closed:
                    summaryData.closed,

                unassigned:
                    summaryData.unassigned,

                averageResolutionTimeDays:
                    Number(
                        averageResolutionTimeDays.toFixed(1)
                    ),

                closedIssueCount:
                    summaryData.resolutionCount
            },

            reportsByStatus:
                analyticsResult.reportsByStatus.map(
                    (item) => ({
                        status:
                            item._id || "Unknown",

                        count:
                            item.count
                    })
                ),

            reportsByCampus:
                analyticsResult.reportsByCampus.map(
                    (item) => ({
                        campus:
                            item._id || "Unknown",

                        count:
                            item.count
                    })
                ),

            reportsByPriority:
                analyticsResult.reportsByPriority.map(
                    (item) => ({
                        priority:
                            item._id || "Unknown",

                        count:
                            item.count
                    })
                ),

            reportsOverTime:
                analyticsResult.reportsOverTime.map(
                    (item) => {
                        const date =
                            item._id
                                .toISOString()
                                .substring(0, 10);

                        let label = date;

                        if (groupBy === "day") {
                            label =
                                item._id.toLocaleDateString(
                                    "en-AU",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        timeZone: "Australia/Sydney"
                                    }
                                );
                        }

                        if (groupBy === "week") {
                            const weekEnd =
                                new Date(item._id);

                            weekEnd.setDate(
                                weekEnd.getDate() + 6
                            );

                            label =
                                `${item._id.toLocaleDateString(
                                    "en-AU",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        timeZone: "Australia/Sydney"
                                    }
                                )} – ${weekEnd.toLocaleDateString(
                                    "en-AU",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        timeZone: "Australia/Sydney"
                                    }
                                )}`;
                        }

                        if (groupBy === "month") {
                            label =
                                item._id.toLocaleDateString(
                                    "en-AU",
                                    {
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "Australia/Sydney"
                                    }
                                );
                        }

                        return {
                            date,
                            label,
                            count:
                                item.count
                        };
                    }
                ),

            issuesSolvedOverTime:
                analyticsResult.issuesSolvedOverTime.map(
                    (item) => {
                        const date =
                            item._id
                                .toISOString()
                                .substring(0, 10);

                        let label = date;

                        if (groupBy === "day") {
                            label =
                                item._id.toLocaleDateString(
                                    "en-AU",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        timeZone: "Australia/Sydney"
                                    }
                                );
                        }

                        if (groupBy === "week") {
                            const weekEnd =
                                new Date(item._id);

                            weekEnd.setDate(
                                weekEnd.getDate() + 6
                            );

                            label =
                                `${item._id.toLocaleDateString(
                                    "en-AU",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        timeZone: "Australia/Sydney"
                                    }
                                )} – ${weekEnd.toLocaleDateString(
                                    "en-AU",
                                    {
                                        day: "numeric",
                                        month: "short",
                                        timeZone: "Australia/Sydney"
                                    }
                                )}`;
                        }

                        if (groupBy === "month") {
                            label =
                                item._id.toLocaleDateString(
                                    "en-AU",
                                    {
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "Australia/Sydney"
                                    }
                                );
                        }

                        return {
                            date,
                            label,
                            count:
                                item.count
                        };
                    }
                ),

            unresolvedIssuesByAge:
                analyticsResult.unresolvedIssuesByAge.map(
                    (item) => ({
                        ageGroup:
                            item._id,

                        count:
                            item.count
                    })
                ),

            issuesRequiringAttention:
                analyticsResult.issuesRequiringAttention || []
        });

    } catch (err) {
        console.error(
            "Failed to fetch admin analytics:",
            err
        );

        res.status(500).json({
            error:
                "Failed to fetch admin analytics"
        });
    }
});

export default router;