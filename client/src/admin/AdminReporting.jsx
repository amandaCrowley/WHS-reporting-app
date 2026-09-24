/**
 * AdminReporting.jsx
 *
 * This page provides administrators with reporting and analytics
 * for workplace health and safety issues.
 *
 * Administrators can filter reporting data by:
 * - Date range
 * - Campus
 * - Issue status
 * - Issue priority
 * - Reporting user type
 *
 * The page displays:
 * - Total issues
 * - Issues by status
 * - Issues by campus
 * - Issues over time
 * - Issues solved over time
 * - Issues by priority
 * - Average resolution time
 * - Unresolved issues by age
 * - Five oldest unresolved issues requiring attention
 *
 * The page also provides a print-only executive report that can
 * be saved as a PDF using the browser print dialog.
 *
 * Author/s: Amanda Foxley
 * Date created: 23/09/26
 */

import { useEffect, useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    LayoutDashboard,
    ClipboardList,
    Users,
    LogOut,
    BarChart3,
    FileText,
    CircleAlert,
    Clock3,
    Check,
    UserMinus,
    Timer,
    Download,
    Activity,
} from "lucide-react";

import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";
import { useNotifications } from "../hooks/useNotifications";
import NotificationBell from "../components/NotificationBell";
import MobilePageHeading from "../components/MobilePageHeading";
import useMobileNavigation from "../hooks/useMobileNavigation";

import UONLogo from "../images/UONLogo White.png";

import "../styles/AdminReporting.css";


/* =========================================================
   CHART COLOURS
   ========================================================= */

const PIE_COLOURS = [
    "#0758d7",
    "#7c3aed",
    "#0891b2",
    "#15803d",
    "#f59e0b",
    "#db2777",
    "#64748b",
];

const CAMPUS_COLOURS = {
    Callaghan: "#0758d7",
    Ourimbah: "#7c3aed",
    "Newcastle City": "#0891b2",
    "Gosford Hospital": "#15803d",
    "Gosford Mann Street": "#f59e0b",
    Sydney: "#db2777",
    "Port Macquarie": "#64748b",
};


/* =========================================================
   GENERAL CHART HELPERS
   ========================================================= */

/**
 * Return the appropriate colour for a chart item.
 */
const getPieColour = (
    label,
    index,
    labelKey
) => {

    if (
        labelKey === "campus" &&
        CAMPUS_COLOURS[label]
    ) {
        return CAMPUS_COLOURS[label];
    }

    if (labelKey === "status") {

        const statusColours = {
            Open: "#0758d7",
            "In Progress": "#f59e0b",
            Closed: "#15803d",
        };

        if (statusColours[label]) {
            return statusColours[label];
        }
    }

    if (labelKey === "priority") {

        const priorityColours = {
            Critical: "#990101",
            High: "#d68f14",
            Medium: "#00027a",
            Low: "#0a5710",
        };

        if (priorityColours[label]) {
            return priorityColours[label];
        }
    }

    return PIE_COLOURS[
        index % PIE_COLOURS.length
    ];
};


/**
 * Generate a CSS conic gradient for the screen
 * doughnut charts.
 */
const getPieGradient = (
    items,
    labelKey
) => {

    if (
        !items ||
        items.length === 0
    ) {
        return "conic-gradient(#e5e7eb 0deg 360deg)";
    }

    const total =
        items.reduce(
            (sum, item) =>
                sum + Number(item.count || 0),
            0
        );

    if (total === 0) {
        return "conic-gradient(#e5e7eb 0deg 360deg)";
    }

    let currentAngle = 0;

    const segments =
        items.map(
            (item, index) => {

                const count =
                    Number(item.count || 0);

                const percentage =
                    (count / total) * 100;

                const startAngle =
                    currentAngle;

                const endAngle =
                    currentAngle +
                    percentage * 3.6;

                currentAngle =
                    endAngle;

                const label =
                    item[labelKey] ||
                    "Unknown";

                return `${getPieColour(
                    label,
                    index,
                    labelKey
                )} ${startAngle}deg ${endAngle}deg`;
            }
        );

    return `conic-gradient(${segments.join(", ")})`;
};


/**
 * Return the largest count in a dataset.
 */
const getMaximumCount = (
    items
) => {

    if (
        !items ||
        items.length === 0
    ) {
        return 0;
    }

    return Math.max(
        ...items.map(
            (item) =>
                Number(item.count || 0)
        )
    );
};


/* =========================================================
   SCREEN DOUGHNUT CHART
   ========================================================= */

function PieChart({
    items,
    labelKey,
    emptyMessage = "No reports found.",
}) {

    if (
        !items ||
        items.length === 0
    ) {
        return (
            <div className="admin-reporting-panel-message">
                {emptyMessage}
            </div>
        );
    }

    const total =
        items.reduce(
            (sum, item) =>
                sum + Number(item.count || 0),
            0
        );

    if (total === 0) {
        return (
            <div className="admin-reporting-panel-message">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="admin-reporting-pie-content">

            <div
                className="admin-reporting-pie-chart"
                style={{
                    background:
                        getPieGradient(
                            items,
                            labelKey
                        ),
                }}
                aria-label={`Chart showing ${total} total issues`}
            >
                <div className="admin-reporting-pie-centre">
                    <strong>{total}</strong>
                    <span>Total</span>
                </div>
            </div>

            <div className="admin-reporting-pie-legend">

                {items.map(
                    (item, index) => {

                        const count =
                            Number(
                                item.count || 0
                            );

                        const percentage =
                            Math.round(
                                (
                                    count /
                                    total
                                ) * 100
                            );

                        const label =
                            item[labelKey] ||
                            "Unknown";

                        return (
                            <div
                                className="admin-reporting-pie-legend-item"
                                key={`${label}-${index}`}
                            >

                                <div className="admin-reporting-pie-legend-label">

                                    <span
                                        className="admin-reporting-pie-legend-dot"
                                        style={{
                                            background:
                                                getPieColour(
                                                    label,
                                                    index,
                                                    labelKey
                                                ),
                                        }}
                                    />

                                    <span className="admin-reporting-pie-legend-name">
                                        {label}
                                    </span>

                                </div>

                                <span className="admin-reporting-pie-legend-value">
                                    {count} ({percentage}%)
                                </span>

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}


/* =========================================================
   SCREEN HORIZONTAL BAR CHART
   ========================================================= */

function HorizontalBarChart({
    items,
    labelKey,
    emptyMessage = "No data available.",
}) {

    if (
        !items ||
        items.length === 0
    ) {
        return (
            <div className="admin-reporting-panel-message">
                {emptyMessage}
            </div>
        );
    }

    const maximum =
        getMaximumCount(items);

    if (maximum === 0) {
        return (
            <div className="admin-reporting-panel-message">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="admin-reporting-bar-list">

            {items.map(
                (item, index) => {

                    const count =
                        Number(
                            item.count || 0
                        );

                    const percentage =
                        maximum > 0
                            ? (
                                count /
                                maximum
                            ) * 100
                            : 0;

                    const label =
                        item[labelKey] ||
                        "Unknown";

                    return (
                        <div
                            className="admin-reporting-bar-item"
                            key={`${label}-${index}`}
                        >

                            <div className="admin-reporting-bar-label">

                                <span>
                                    {label}
                                </span>

                                <span>
                                    {count}
                                </span>

                            </div>

                            <div className="admin-reporting-bar-track">

                                <div
                                    className="admin-reporting-bar-fill age"
                                    style={{
                                        width:
                                            `${percentage}%`,
                                    }}
                                />

                            </div>

                        </div>
                    );
                }
            )}

        </div>
    );
}


/* =========================================================
   PRINT SVG DOUGHNUT CHART
   ========================================================= */

function PrintDonutChart({
    items,
    labelKey,
    title,
}) {

    if (
        !items ||
        items.length === 0
    ) {
        return (
            <div className="admin-reporting-print-chart-card">

                <h3>{title}</h3>

                <p className="admin-reporting-print-no-data">
                    No data available.
                </p>

            </div>
        );
    }

    const total =
        items.reduce(
            (sum, item) =>
                sum + Number(item.count || 0),
            0
        );

    if (total === 0) {
        return (
            <div className="admin-reporting-print-chart-card">

                <h3>{title}</h3>

                <p className="admin-reporting-print-no-data">
                    No data available.
                </p>

            </div>
        );
    }

    const size = 150;
    const centre = size / 2;
    const radius = 50;
    const circumference =
        2 * Math.PI * radius;

    let cumulativePercentage = 0;

    return (
        <div className="admin-reporting-print-chart-card">

            <h3>{title}</h3>

            <div className="admin-reporting-print-donut">

                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    role="img"
                    aria-label={`${title}, ${total} total issues`}
                >

                    <circle
                        cx={centre}
                        cy={centre}
                        r={radius}
                        fill="none"
                        stroke="#edf0f4"
                        strokeWidth="20"
                    />

                    {items.map(
                        (item, index) => {

                            const count =
                                Number(
                                    item.count || 0
                                );

                            const percentage =
                                count /
                                total;

                            const dashLength =
                                percentage *
                                circumference;

                            const dashOffset =
                                -(
                                    cumulativePercentage *
                                    circumference
                                );

                            cumulativePercentage +=
                                percentage;

                            const label =
                                item[labelKey] ||
                                "Unknown";

                            return (
                                <circle
                                    key={`${title}-${label}-${index}`}
                                    cx={centre}
                                    cy={centre}
                                    r={radius}
                                    fill="none"
                                    stroke={getPieColour(
                                        label,
                                        index,
                                        labelKey
                                    )}
                                    strokeWidth="20"
                                    strokeDasharray={`${dashLength} ${circumference}`}
                                    strokeDashoffset={
                                        dashOffset
                                    }
                                    transform={`rotate(-90 ${centre} ${centre})`}
                                />
                            );
                        }
                    )}

                    <circle
                        cx={centre}
                        cy={centre}
                        r="35"
                        fill="#ffffff"
                    />

                    <text
                        x={centre}
                        y="73"
                        textAnchor="middle"
                        fill="#07132f"
                        fontSize="21"
                        fontWeight="700"
                    >
                        {total}
                    </text>

                    <text
                        x={centre}
                        y="88"
                        textAnchor="middle"
                        fill="#667085"
                        fontSize="9"
                    >
                        Total
                    </text>

                </svg>

                <div className="admin-reporting-print-donut-legend">

                    {items.map(
                        (item, index) => {

                            const count =
                                Number(
                                    item.count || 0
                                );

                            const percentage =
                                Math.round(
                                    (
                                        count /
                                        total
                                    ) * 100
                                );

                            const label =
                                item[labelKey] ||
                                "Unknown";

                            return (
                                <div
                                    className="admin-reporting-print-donut-legend-item"
                                    key={`${title}-legend-${label}-${index}`}
                                >

                                    <span
                                        className="admin-reporting-print-donut-legend-dot"
                                        style={{
                                            background:
                                                getPieColour(
                                                    label,
                                                    index,
                                                    labelKey
                                                ),
                                        }}
                                    />

                                    <span className="admin-reporting-print-donut-legend-label">
                                        {label}
                                    </span>

                                    <span className="admin-reporting-print-donut-legend-value">
                                        {count} ({percentage}%)
                                    </span>

                                </div>
                            );
                        }
                    )}

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   PRINT HORIZONTAL BAR CHART
   ========================================================= */

function PrintHorizontalBarChart({
    items,
    labelKey,
    title,
}) {

    if (
        !items ||
        items.length === 0
    ) {
        return (
            <div className="admin-reporting-print-chart-card">

                <h3>{title}</h3>

                <p className="admin-reporting-print-no-data">
                    No data available.
                </p>

            </div>
        );
    }

    const maximum =
        getMaximumCount(items);

    return (
        <div className="admin-reporting-print-chart-card">

            <h3>{title}</h3>

            <div className="admin-reporting-print-bar-chart">

                {items.map(
                    (item, index) => {

                        const count =
                            Number(
                                item.count || 0
                            );

                        const percentage =
                            maximum > 0
                                ? (
                                    count /
                                    maximum
                                ) * 100
                                : 0;

                        const label =
                            item[labelKey] ||
                            "Unknown";

                        return (
                            <div
                                className="admin-reporting-print-bar-row"
                                key={`${title}-${label}-${index}`}
                            >

                                <span className="admin-reporting-print-bar-label">
                                    {label}
                                </span>

                                <div className="admin-reporting-print-bar-track">

                                    <div
                                        className="admin-reporting-print-bar-fill"
                                        style={{
                                            width:
                                                `${percentage}%`,
                                        }}
                                    />

                                </div>

                                <span className="admin-reporting-print-bar-value">
                                    {count}
                                </span>

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}


/* =========================================================
   PRINT VERTICAL TIME CHART
   ========================================================= */

function PrintTimeChart({
    items,
    title,
    emptyMessage,
    barColour = "#0758d7",
}) {

    if (
        !items ||
        items.length === 0
    ) {
        return (
            <div className="admin-reporting-print-chart-card">

                <h3>{title}</h3>

                <p className="admin-reporting-print-no-data">
                    {emptyMessage ||
                        "No data available for the selected filters."}
                </p>

            </div>
        );
    }

    const maximum =
        getMaximumCount(items);

    const width = 760;
    const height = 235;

    const marginLeft = 35;
    const marginRight = 15;
    const marginTop = 20;
    const marginBottom = 55;

    const chartWidth =
        width -
        marginLeft -
        marginRight;

    const chartHeight =
        height -
        marginTop -
        marginBottom;

    const columnWidth =
        chartWidth /
        items.length;

    return (
        <div className="admin-reporting-print-chart-card">

            <h3>{title}</h3>

            <div className="admin-reporting-print-time-chart">

                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label={title}
                >

                    {/* Horizontal baseline */}

                    <line
                        x1={marginLeft}
                        y1={
                            marginTop +
                            chartHeight
                        }
                        x2={
                            width -
                            marginRight
                        }
                        y2={
                            marginTop +
                            chartHeight
                        }
                        stroke="#dfe3ea"
                        strokeWidth="1"
                    />

                    {items.map(
                        (item, index) => {

                            const count =
                                Number(
                                    item.count || 0
                                );

                            const barHeight =
                                maximum > 0
                                    ? (
                                        count /
                                        maximum
                                    ) *
                                    chartHeight
                                    : 0;

                            const barWidth =
                                Math.max(
                                    columnWidth *
                                    0.55,
                                    8
                                );

                            const x =
                                marginLeft +
                                (
                                    index *
                                    columnWidth
                                ) +
                                (
                                    (
                                        columnWidth -
                                        barWidth
                                    ) / 2
                                );

                            const y =
                                marginTop +
                                chartHeight -
                                barHeight;

                            const label =
                                item.label ||
                                item.date ||
                                "-";

                            return (
                                <g
                                    key={`${title}-${item.date}-${index}`}
                                >

                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={
                                            Math.max(
                                                barHeight,
                                                count > 0
                                                    ? 2
                                                    : 0
                                            )
                                        }
                                        rx="2"
                                        fill={barColour}
                                    />

                                    <text
                                        x={
                                            x +
                                            barWidth / 2
                                        }
                                        y={
                                            y -
                                            5
                                        }
                                        textAnchor="middle"
                                        className="admin-reporting-print-time-value"
                                    >
                                        {count}
                                    </text>

                                    <text
                                        x={
                                            x +
                                            barWidth / 2
                                        }
                                        y={
                                            marginTop +
                                            chartHeight +
                                            17
                                        }
                                        textAnchor="middle"
                                        className="admin-reporting-print-time-label"
                                    >
                                        {label}
                                    </text>

                                </g>
                            );
                        }
                    )}

                </svg>

            </div>

        </div>
    );
}


/* =========================================================
   PRINT TABLE
   ========================================================= */

function PrintTable({
    title,
    headers,
    rows,
}) {

    return (
        <div className="admin-reporting-print-chart-card">

            {title && (
                <h3>{title}</h3>
            )}

            {rows.length === 0 ? (

                <p className="admin-reporting-print-no-data">
                    No data available for the selected filters.
                </p>

            ) : (

                <table className="admin-reporting-print-table">

                    <thead>

                        <tr>

                            {headers.map(
                                (header) => (
                                    <th key={header}>
                                        {header}
                                    </th>
                                )
                            )}

                        </tr>

                    </thead>

                    <tbody>

                        {rows.map(
                            (
                                row,
                                rowIndex
                            ) => (

                                <tr
                                    key={`print-row-${rowIndex}`}
                                >

                                    {row.map(
                                        (
                                            cell,
                                            cellIndex
                                        ) => (

                                            <td
                                                key={`print-cell-${rowIndex}-${cellIndex}`}
                                            >
                                                {cell}
                                            </td>

                                        )
                                    )}

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

            )}

        </div>
    );
}


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function AdminReporting() {
    const mobileNavigation = useMobileNavigation();

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const logout =
        userLogout();

    const {
        userData,
        loading,
        error,
    } = getUserData();

    useNotifications(
        userData?.firebaseUid
    );


    /* =====================================================
       STATE
    ===================================================== */

    const [analytics, setAnalytics] =
        useState(null);

    const [
        analyticsLoading,
        setAnalyticsLoading,
    ] = useState(true);

    const [
        analyticsError,
        setAnalyticsError,
    ] = useState("");


    const [startDate, setStartDate] =
        useState("");

    const [endDate, setEndDate] =
        useState("");

    const [campus, setCampus] =
        useState("All");

    const [status, setStatus] =
        useState("All");

    const [priority, setPriority] =
        useState("All");

    const [role, setRole] =
        useState("All");


    const [
        appliedFilters,
        setAppliedFilters,
    ] = useState({
        startDate: "",
        endDate: "",
        campus: "All",
        status: "All",
        priority: "All",
        role: "All",
    });


    const [
        timeGrouping,
        setTimeGrouping,
    ] = useState("day");


    /* =====================================================
       DATE HELPERS
    ===================================================== */

    const formatDate = (
        date
    ) => {

        if (!date) {
            return "Unknown";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "Unknown";
        }

        return parsedDate.toLocaleDateString(
            "en-AU",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };


    const formatDateTime = (
        date
    ) => {

        if (!date) {
            return "-";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }

        return parsedDate.toLocaleString(
            "en-AU",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }
        );
    };


    const formatAge = (
        days
    ) => {

        if (
            days === null ||
            days === undefined ||
            Number.isNaN(
                Number(days)
            )
        ) {
            return "Unknown";
        }

        const numericDays =
            Number(days);

        return `${numericDays} ${numericDays === 1
            ? "day"
            : "days"
            }`;
    };


    /* =====================================================
       FETCH ANALYTICS
    ===================================================== */

    useEffect(
        () => {

            if (
                !userData?.firebaseUid
            ) {
                return;
            }

            const fetchAnalytics =
                async () => {

                    try {

                        setAnalyticsLoading(
                            true
                        );

                        setAnalyticsError(
                            ""
                        );

                        let url =
                            `http://localhost:8000/api/admin/analytics/${userData.firebaseUid}`;

                        const params =
                            new URLSearchParams();


                        if (
                            appliedFilters.startDate
                        ) {
                            params.append(
                                "startDate",
                                appliedFilters.startDate
                            );
                        }

                        if (
                            appliedFilters.endDate
                        ) {
                            params.append(
                                "endDate",
                                appliedFilters.endDate
                            );
                        }

                        if (
                            appliedFilters.campus !==
                            "All"
                        ) {
                            params.append(
                                "campus",
                                appliedFilters.campus
                            );
                        }

                        if (
                            appliedFilters.status !==
                            "All"
                        ) {
                            params.append(
                                "status",
                                appliedFilters.status
                            );
                        }

                        if (
                            appliedFilters.priority !==
                            "All"
                        ) {
                            params.append(
                                "priority",
                                appliedFilters.priority
                            );
                        }

                        if (
                            appliedFilters.role !==
                            "All"
                        ) {
                            params.append(
                                "role",
                                appliedFilters.role
                            );
                        }

                        params.append(
                            "groupBy",
                            timeGrouping
                        );


                        if (
                            params.toString()
                        ) {
                            url +=
                                `?${params.toString()}`;
                        }


                        const response =
                            await fetch(url);


                        if (
                            !response.ok
                        ) {

                            const data =
                                await response
                                    .json()
                                    .catch(
                                        () => ({})
                                    );

                            throw new Error(
                                data.error ||
                                "Failed to load reporting data."
                            );
                        }


                        const data =
                            await response.json();

                        setAnalytics(
                            data
                        );

                    } catch (err) {

                        console.error(
                            "Failed to fetch analytics:",
                            err
                        );

                        setAnalyticsError(
                            err.message ||
                            "Failed to load reporting data."
                        );

                    } finally {

                        setAnalyticsLoading(
                            false
                        );

                    }
                };


            fetchAnalytics();

        },
        [
            userData,
            appliedFilters,
            timeGrouping,
        ]
    );


    /* =====================================================
       FILTER ACTIONS
    ===================================================== */

    const applyFilters =
        () => {

            setAppliedFilters({
                startDate,
                endDate,
                campus,
                status,
                priority,
                role,
            });
        };


    const clearFilters =
        () => {

            setStartDate("");
            setEndDate("");
            setCampus("All");
            setStatus("All");
            setPriority("All");
            setRole("All");

            setAppliedFilters({
                startDate: "",
                endDate: "",
                campus: "All",
                status: "All",
                priority: "All",
                role: "All",
            });
        };


    /* =====================================================
       FILTER LABEL
    ===================================================== */

    const getFilterLabel =
        () => {

            const filters = [];


            if (
                appliedFilters.startDate
            ) {
                filters.push(
                    `From ${formatDate(
                        appliedFilters.startDate
                    )}`
                );
            }


            if (
                appliedFilters.endDate
            ) {
                filters.push(
                    `To ${formatDate(
                        appliedFilters.endDate
                    )}`
                );
            }


            if (
                appliedFilters.campus !==
                "All"
            ) {
                filters.push(
                    appliedFilters.campus
                );
            }


            if (
                appliedFilters.status !==
                "All"
            ) {
                filters.push(
                    appliedFilters.status
                );
            }


            if (
                appliedFilters.priority !==
                "All"
            ) {
                filters.push(
                    `${appliedFilters.priority} priority`
                );
            }


            if (
                appliedFilters.role !==
                "All"
            ) {
                filters.push(
                    appliedFilters.role
                );
            }


            return filters.length > 0
                ? `Filters Applied: ${filters.join(
                    " · "
                )}`
                : "";
        };


    /* =====================================================
       STATUS / ASSIGNMENT HELPERS
    ===================================================== */

    const getStatusClass =
        (itemStatus) => {

            if (
                itemStatus ===
                "Open"
            ) {
                return "admin-reporting-status-open";
            }

            if (
                itemStatus ===
                "In Progress"
            ) {
                return "admin-reporting-status-progress";
            }

            if (
                itemStatus ===
                "Closed"
            ) {
                return "admin-reporting-status-closed";
            }

            return "admin-reporting-status-default";
        };


    const getAssigneeLabel =
        (issue) => {

            const assignee =
                issue?.assignedToName;


            if (
                typeof assignee ===
                "string" &&
                assignee.trim()
            ) {
                return assignee.trim();
            }


            if (
                assignee?.firstName ||
                assignee?.lastName
            ) {
                return [
                    assignee.firstName,
                    assignee.lastName,
                ]
                    .filter(Boolean)
                    .join(" ");
            }


            if (
                issue?.assignedTo?.firstName ||
                issue?.assignedTo?.lastName
            ) {
                return [
                    issue.assignedTo.firstName,
                    issue.assignedTo.lastName,
                ]
                    .filter(Boolean)
                    .join(" ");
            }


            if (
                issue?.assignedTo
            ) {
                return "Assigned admin";
            }


            return "Unassigned";
        };


    const viewIssue =
        (issueId) => {

            if (issueId) {
                navigate(
                    `/issue/${issueId}`
                );
            }
        };


    /* =====================================================
       PRINT HELPERS
    ===================================================== */

    const getPrintFilterLabel =
        (
            label,
            value
        ) =>
            `${label}: ${value === "All" ||
                !value
                ? "All"
                : value
            }`;


    const getPrintPeriod =
        () => {

            if (
                appliedFilters.startDate &&
                appliedFilters.endDate
            ) {
                return `${formatDate(
                    appliedFilters.startDate
                )} to ${formatDate(
                    appliedFilters.endDate
                )}`;
            }


            if (
                appliedFilters.startDate
            ) {
                return `From ${formatDate(
                    appliedFilters.startDate
                )}`;
            }


            if (
                appliedFilters.endDate
            ) {
                return `To ${formatDate(
                    appliedFilters.endDate
                )}`;
            }


            return "All available dates";
        };


    const printReport =
        () => {

            window.print();
        };


    /* =====================================================
       ANALYTICS DATA
    ===================================================== */

    const stats =
        analytics?.stats || {};

    const reportsOverTime =
        analytics?.reportsOverTime || [];

    const reportsByStatus =
        analytics?.reportsByStatus || [];

    const reportsByCampus =
        analytics?.reportsByCampus || [];

    const reportsByPriority =
        analytics?.reportsByPriority || [];

    const unresolvedIssuesByAge =
        analytics?.unresolvedIssuesByAge ||
        [];

    const issuesSolvedOverTime =
        analytics?.issuesSolvedOverTime ||
        [];

    const issuesRequiringAttention =
        analytics?.issuesRequiringAttention ||
        [];


    /* =====================================================
       LOADING / ERROR
    ===================================================== */

    if (loading) {

        return (
            <div className="admin-reporting-message">

                <h1>
                    Reporting & Analytics
                </h1>

                <p>
                    Loading admin data...
                </p>

            </div>
        );
    }


    if (error) {

        return (
            <div className="admin-reporting-message">

                <h1>
                    Reporting & Analytics
                </h1>

                <p>
                    {error}
                </p>

            </div>
        );
    }


    if (!userData) {

        return (
            <p className="admin-reporting-message">
                No user data found.
            </p>
        );
    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (

        <div
            className={`user-dashboard admin-reporting ${mobileNavigation.layoutClassName}`}
            onKeyDown={mobileNavigation.onKeyDown}
        >


            {/* =================================================
                SIDEBAR
            ================================================== */}

            <aside className="user-dashboard-sidebar" {...mobileNavigation.sidebarProps}>

                <div className="user-dashboard-logo">

                    <img
                        src={UONLogo}
                        alt="The University of Newcastle Australia"
                    />

                </div>


                <nav className="user-dashboard-nav" aria-label="Administrator navigation">

                    <button
                        type="button"
                        className={
                            `user-dashboard-nav-item ${location.pathname ===
                                "/admin/dashboard"
                                ? "active"
                                : ""
                            }`
                        }
                        onClick={() =>
                            navigate(
                                "/admin/dashboard"
                            )
                        }
                    >

                        <LayoutDashboard />

                        <span>
                            Dashboard
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            `user-dashboard-nav-item ${location.pathname ===
                                "/admin/manageissues"
                                ? "active"
                                : ""
                            }`
                        }
                        onClick={() =>
                            navigate(
                                "/admin/manageissues"
                            )
                        }
                    >

                        <ClipboardList />

                        <span>
                            Manage Issues
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            `user-dashboard-nav-item ${location.pathname ===
                                "/admin/usermanagement"
                                ? "active"
                                : ""
                            }`
                        }
                        onClick={() =>
                            navigate(
                                "/admin/usermanagement"
                            )
                        }
                    >

                        <Users />

                        <span>
                            User Management
                        </span>

                    </button>


                    <button
                        type="button"
                        className={
                            `user-dashboard-nav-item ${location.pathname ===
                                "/admin/reporting"
                                ? "active"
                                : ""
                            }`
                        }
                        onClick={() =>
                            navigate(
                                "/admin/reporting"
                            )
                        }
                    >

                        <BarChart3 />

                        <span>
                            Reporting & Analytics
                        </span>

                    </button>

                </nav>


                <div className="user-dashboard-logout-section">

                    <button
                        type="button"
                        className="user-dashboard-logout"
                        onClick={logout}
                    >

                        <LogOut />

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* =================================================
                MAIN
            ================================================== */}

            <div className="user-dashboard-main">


                {/* =================================================
                    HEADER
                ================================================== */}

                <header className="user-dashboard-header">

                    <MobilePageHeading
                        title="Reporting & Analytics"
                        {...mobileNavigation.headingProps}
                    />


                    <div className="user-dashboard-header-user">

                        <span>
                            Welcome{" "}
                            {userData?.firstName ||
                                "Admin"}
                        </span>

                        <NotificationBell
                            firebaseUid={
                                userData?.firebaseUid
                            }
                        />

                    </div>

                </header>


                <main className="user-dashboard-content">


                    {/* =================================================
                        PAGE INTRO
                    ================================================== */}
                    <section className="admin-reporting-intro">

                        <div className="admin-reporting-intro-content">

                            <div className="admin-reporting-intro-icon">
                                <Activity />
                            </div>

                            <div>
                                <p>
                                    View trends, issue statistics and
                                    resolution performance across
                                    reported WHS issues.
                                </p>
                            </div>

                        </div>


                        <div className="admin-reporting-export">

                            <div className="admin-reporting-export-controls">

                                <button
                                    type="button"
                                    onClick={printReport}
                                    disabled={analyticsLoading}
                                >

                                    <Download size={16} />

                                    Save as PDF

                                </button>

                            </div>

                            <span className="admin-reporting-export-hint">
                                Opens the print dialog. Choose Save as PDF.
                            </span>

                        </div>

                    </section>


                    {/* =================================================
                        FILTERS
                    ================================================== */}

                    <section className="admin-reporting-filters">


                        <div className="admin-reporting-filter">

                            <label htmlFor="start-date">
                                Start date
                            </label>

                            <input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="admin-reporting-filter">

                            <label htmlFor="end-date">
                                End date
                            </label>

                            <input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="admin-reporting-filter">

                            <label htmlFor="campus-filter">
                                Campus
                            </label>

                            <select
                                id="campus-filter"
                                value={campus}
                                onChange={(event) =>
                                    setCampus(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All campuses
                                </option>

                                <option value="Callaghan">
                                    Callaghan
                                </option>

                                <option value="Ourimbah">
                                    Ourimbah
                                </option>

                                <option value="Newcastle City">
                                    Newcastle City
                                </option>

                                <option value="Gosford Hospital">
                                    Gosford Hospital
                                </option>

                                <option value="Gosford Mann Street">
                                    Gosford Mann Street
                                </option>

                                <option value="Sydney">
                                    Sydney
                                </option>

                                <option value="Port Macquarie">
                                    Port Macquarie
                                </option>

                            </select>

                        </div>


                        <div className="admin-reporting-filter">

                            <label htmlFor="status-filter">
                                Status
                            </label>

                            <select
                                id="status-filter"
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All statuses
                                </option>

                                <option value="Open">
                                    Open
                                </option>

                                <option value="In Progress">
                                    In Progress
                                </option>

                                <option value="Closed">
                                    Closed
                                </option>

                            </select>

                        </div>


                        <div className="admin-reporting-filter">

                            <label htmlFor="priority-filter">
                                Priority
                            </label>

                            <select
                                id="priority-filter"
                                value={priority}
                                onChange={(event) =>
                                    setPriority(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All priorities
                                </option>

                                <option value="Low">
                                    Low
                                </option>

                                <option value="Medium">
                                    Medium
                                </option>

                                <option value="High">
                                    High
                                </option>

                                <option value="Critical">
                                    Critical
                                </option>

                            </select>

                        </div>


                        <div className="admin-reporting-filter">

                            <label htmlFor="user-type-filter">
                                User type
                            </label>

                            <select
                                id="user-type-filter"
                                value={role}
                                onChange={(event) =>
                                    setRole(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All user types
                                </option>

                                <option value="Student">
                                    Student
                                </option>

                                <option value="Staff">
                                    Staff
                                </option>

                                <option value="Visitor">
                                    Visitor
                                </option>

                                <option value="Contractor">
                                    Contractor
                                </option>

                            </select>

                        </div>


                        <div className="admin-reporting-filter-actions">

                            <button
                                type="button"
                                className="admin-reporting-apply-button"
                                onClick={applyFilters}
                            >
                                Apply filters
                            </button>

                            <button
                                type="button"
                                className="admin-reporting-filter-clear"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>

                        </div>

                    </section>


                    {/* =================================================
                        SUMMARY STATISTICS
                    ================================================== */}

                    <section className="user-dashboard-status-grid">

                        <article className="user-dashboard-status-card status-open">

                            <div className="user-dashboard-status-icon">
                                <FileText />
                            </div>

                            <div className="user-dashboard-status-content">

                                <h3>
                                    Total System Issues
                                </h3>

                                <strong>
                                    {analyticsLoading
                                        ? "..."
                                        : stats.total ?? 0}
                                </strong>

                                <p>
                                    Reported WHS issues
                                </p>

                            </div>

                        </article>


                        <article className="user-dashboard-status-card admin-reporting-unassigned">

                            <div className="user-dashboard-status-icon">
                                <UserMinus />
                            </div>

                            <div className="user-dashboard-status-content">

                                <h3>
                                    Unassigned
                                </h3>

                                <strong>
                                    {analyticsLoading
                                        ? "..."
                                        : stats.unassigned ?? 0}
                                </strong>

                                <p>
                                    Issues needing assignment
                                </p>

                            </div>

                        </article>


                        <article className="user-dashboard-status-card admin-reporting-resolution">

                            <div className="user-dashboard-status-icon">
                                <Timer />
                            </div>

                            <div className="user-dashboard-status-content">

                                <h3>
                                    Average Resolution
                                </h3>

                                <strong>

                                    {analyticsLoading
                                        ? "..."
                                        : stats.averageResolutionTimeDays ?? 0}

                                    <span className="admin-reporting-stat-unit">
                                        {" "}days
                                    </span>

                                </strong>

                                <p>
                                    Average time to close
                                </p>

                            </div>

                        </article>

                    </section>


                    <section className="user-dashboard-status-grid">

                        <article className="user-dashboard-status-card status-open">

                            <div className="user-dashboard-status-icon">
                                <CircleAlert />
                            </div>

                            <div className="user-dashboard-status-content">

                                <h3>
                                    Open
                                </h3>

                                <strong>
                                    {analyticsLoading
                                        ? "..."
                                        : stats.open ?? 0}
                                </strong>

                                <p>
                                    Waiting for action
                                </p>

                            </div>

                        </article>


                        <article className="user-dashboard-status-card status-progress">

                            <div className="user-dashboard-status-icon">
                                <Clock3 />
                            </div>

                            <div className="user-dashboard-status-content">

                                <h3>
                                    In Progress
                                </h3>

                                <strong>
                                    {analyticsLoading
                                        ? "..."
                                        : stats.inProgress ?? 0}
                                </strong>

                                <p>
                                    Currently being worked on
                                </p>

                            </div>

                        </article>


                        <article className="user-dashboard-status-card status-closed">

                            <div className="user-dashboard-status-icon">
                                <Check />
                            </div>

                            <div className="user-dashboard-status-content">

                                <h3>
                                    Closed
                                </h3>

                                <strong>
                                    {analyticsLoading
                                        ? "..."
                                        : stats.closed ?? 0}
                                </strong>

                                <p>
                                    Resolved issues
                                </p>

                            </div>

                        </article>

                    </section>


                    {/* =================================================
                        ISSUES REQUIRING ATTENTION
                    ================================================== */}

                    <section className="admin-reporting-section">

                        <div className="admin-reporting-section-header">
                            <div className="admin-reporting-section-header-content">
                                <h2>Issues Requiring Attention</h2>
                                <p>
                                    The 5 oldest unresolved issues matching the selected filters.
                                </p>
                            </div>
                        </div>


                        {analyticsLoading ? (

                            <div className="admin-reporting-panel-message">
                                Loading issues...
                            </div>

                        ) : issuesRequiringAttention.length === 0 ? (

                            <div className="admin-reporting-panel-message">
                                No unresolved issues found.
                            </div>

                        ) : (

                            <div className="admin-reporting-issue-list">

                                {issuesRequiringAttention
                                    .slice(0, 5)
                                    .map(
                                        (issue) => {

                                            const reportedDate =
                                                issue.dateTimeReported
                                                    ? new Date(
                                                        issue.dateTimeReported
                                                    )
                                                    : null;


                                            const ageInDays =
                                                issue.ageDays !==
                                                    undefined &&
                                                    issue.ageDays !==
                                                    null
                                                    ? Number(
                                                        issue.ageDays
                                                    )
                                                    : reportedDate &&
                                                        !Number.isNaN(
                                                            reportedDate.getTime()
                                                        )
                                                        ? Math.max(
                                                            0,
                                                            Math.floor(
                                                                (
                                                                    Date.now() -
                                                                    reportedDate.getTime()
                                                                ) /
                                                                (
                                                                    1000 *
                                                                    60 *
                                                                    60 *
                                                                    24
                                                                )
                                                            )
                                                        )
                                                        : null;


                                            const statusClass =
                                                getStatusClass(
                                                    issue.status
                                                );


                                            const issueId =
                                                issue.issueId ||
                                                issue._id;


                                            return (
                                                <article
                                                    className="admin-reporting-issue-card"
                                                    key={issueId}
                                                    onClick={() =>
                                                        viewIssue(
                                                            issueId
                                                        )
                                                    }
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={
                                                        (event) => {

                                                            if (
                                                                event.key ===
                                                                "Enter" ||
                                                                event.key ===
                                                                " "
                                                            ) {

                                                                event.preventDefault();

                                                                viewIssue(
                                                                    issueId
                                                                );
                                                            }
                                                        }
                                                    }
                                                >

                                                    <div className="admin-reporting-issue-main">

                                                        <h3>
                                                            {issue.title ||
                                                                "Untitled Issue"}
                                                        </h3>

                                                        <p className="admin-reporting-location">
                                                            {issue.campus ||
                                                                "-"}{" "}
                                                            ·{" "}
                                                            {issue.location ||
                                                                "-"}
                                                        </p>

                                                    </div>


                                                    <div className="admin-reporting-issue-details">

                                                        <div>

                                                            <span>
                                                                Priority
                                                            </span>

                                                            <strong className="admin-reporting-priority-badge">
                                                                {issue.priority ||
                                                                    "Not set"}
                                                            </strong>

                                                        </div>


                                                        <div>

                                                            <span>
                                                                Status
                                                            </span>

                                                            <strong
                                                                className={
                                                                    `admin-reporting-status-badge ${statusClass}`
                                                                }
                                                            >
                                                                {issue.status ||
                                                                    "-"}
                                                            </strong>

                                                        </div>


                                                        <div>

                                                            <span>
                                                                Age
                                                            </span>

                                                            <strong>
                                                                {ageInDays !==
                                                                    null
                                                                    ? formatAge(
                                                                        ageInDays
                                                                    )
                                                                    : "-"}
                                                            </strong>

                                                        </div>


                                                        <div>

                                                            <span>
                                                                Date reported
                                                            </span>

                                                            <strong>
                                                                {formatDateTime(
                                                                    issue.dateTimeReported
                                                                )}
                                                            </strong>

                                                        </div>


                                                        <div>

                                                            <span>
                                                                Assigned to
                                                            </span>

                                                            <strong>
                                                                {getAssigneeLabel(
                                                                    issue
                                                                )}
                                                            </strong>

                                                        </div>

                                                    </div>


                                                    <button
                                                        type="button"
                                                        className="admin-reporting-view-button"
                                                        onClick={
                                                            (event) => {

                                                                event.stopPropagation();

                                                                viewIssue(
                                                                    issueId
                                                                );
                                                            }
                                                        }
                                                    >
                                                        View Issue
                                                    </button>

                                                </article>
                                            );
                                        }
                                    )}

                            </div>

                        )}


                        {getFilterLabel() && (

                            <p className="admin-reporting-chart-filters">
                                {getFilterLabel()}
                            </p>

                        )}


                        {!analyticsLoading && (

                            <div className="admin-reporting-issues-footer">

                                <span>
                                    Showing the{" "}
                                    {Math.min(
                                        issuesRequiringAttention.length,
                                        5
                                    )}{" "}
                                    oldest unresolved issue
                                    {Math.min(
                                        issuesRequiringAttention.length,
                                        5
                                    ) === 1
                                        ? ""
                                        : "s"}
                                </span>


                                <button
                                    type="button"
                                    className="admin-reporting-view-all-button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/manageissues"
                                        )
                                    }
                                >
                                    Manage all issues{" "}
                                    <span>
                                        →
                                    </span>
                                </button>

                            </div>

                        )}

                    </section>


                    {/* =================================================
                        STATUS / CAMPUS
                    ================================================== */}

                    <div className="admin-reporting-two-column">


                        {/* STATUS */}

                        <section className="admin-reporting-panel">

                            <div className="admin-reporting-panel-header">

                                <div>

                                    <h2>
                                        Issues by Status
                                    </h2>

                                    <p>
                                        Current issue status distribution.
                                    </p>

                                </div>

                            </div>


                            {analyticsLoading ? (

                                <div className="admin-reporting-panel-message">
                                    Loading...
                                </div>

                            ) : (

                                <PieChart
                                    items={
                                        reportsByStatus
                                    }
                                    labelKey="status"
                                />

                            )}


                            {getFilterLabel() && (

                                <p className="admin-reporting-chart-filters">
                                    {getFilterLabel()}
                                </p>

                            )}

                        </section>


                        {/* CAMPUS */}

                        <section className="admin-reporting-panel">

                            <div className="admin-reporting-panel-header">

                                <div>

                                    <h2>
                                        Issues by Campus
                                    </h2>

                                    <p>
                                        Distribution across University
                                        campuses.
                                    </p>

                                </div>

                            </div>


                            {analyticsLoading ? (

                                <div className="admin-reporting-panel-message">
                                    Loading...
                                </div>

                            ) : (

                                <PieChart
                                    items={
                                        reportsByCampus
                                    }
                                    labelKey="campus"
                                />

                            )}


                            {getFilterLabel() && (

                                <p className="admin-reporting-chart-filters">
                                    {getFilterLabel()}
                                </p>

                            )}

                        </section>

                    </div>


                    {/* =================================================
                        ISSUES REPORTED OVER TIME
                    ================================================== */}

                    <section className="admin-reporting-panel">

                        <div className="admin-reporting-time-header">

                            <div>

                                <h2>
                                    Issues Reported Over Time
                                </h2>

                                <p>
                                    Number of reports submitted
                                    over the selected period.
                                </p>

                            </div>


                            <div className="admin-reporting-time-toggle">

                                <button
                                    type="button"
                                    className={
                                        timeGrouping ===
                                            "day"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setTimeGrouping(
                                            "day"
                                        )
                                    }
                                >
                                    Day
                                </button>


                                <button
                                    type="button"
                                    className={
                                        timeGrouping ===
                                            "week"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setTimeGrouping(
                                            "week"
                                        )
                                    }
                                >
                                    Week
                                </button>


                                <button
                                    type="button"
                                    className={
                                        timeGrouping ===
                                            "month"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setTimeGrouping(
                                            "month"
                                        )
                                    }
                                >
                                    Month
                                </button>

                            </div>

                        </div>


                        {analyticsLoading ? (

                            <div className="admin-reporting-panel-message">
                                Loading reporting data...
                            </div>

                        ) : reportsOverTime.length === 0 ? (

                            <div className="admin-reporting-panel-message">
                                No reports found for the selected
                                filters.
                            </div>

                        ) : (

                            <div className="admin-reporting-time-chart">

                                {reportsOverTime.map(
                                    (item) => {

                                        const maximum =
                                            getMaximumCount(
                                                reportsOverTime
                                            );

                                        const height =
                                            maximum > 0
                                                ? Math.max(
                                                    (
                                                        Number(
                                                            item.count ||
                                                            0
                                                        ) /
                                                        maximum
                                                    ) * 100,
                                                    5
                                                )
                                                : 0;

                                        return (
                                            <div
                                                className="admin-reporting-chart-column"
                                                key={
                                                    item.date
                                                }
                                            >

                                                <div className="admin-reporting-chart-value">
                                                    {item.count}
                                                </div>

                                                <div className="admin-reporting-chart-bar-container">

                                                    <div
                                                        className="admin-reporting-chart-bar"
                                                        style={{
                                                            height:
                                                                `${height}%`,
                                                        }}
                                                    />

                                                </div>

                                                <span>
                                                    {item.label ||
                                                        formatDate(
                                                            item.date
                                                        )}
                                                </span>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        )}


                        {getFilterLabel() && (

                            <p className="admin-reporting-chart-filters">
                                {getFilterLabel()}
                            </p>

                        )}

                    </section>


                    {/* =================================================
                        ISSUES SOLVED OVER TIME
                    ================================================== */}

                    <section className="admin-reporting-panel">

                        <div className="admin-reporting-time-header">

                            <div>

                                <h2>
                                    Issues Solved Over Time
                                </h2>

                                <p>
                                    Number of issues closed during
                                    the selected period.
                                </p>

                            </div>


                            <div className="admin-reporting-time-toggle">

                                <button
                                    type="button"
                                    className={
                                        timeGrouping ===
                                            "day"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setTimeGrouping(
                                            "day"
                                        )
                                    }
                                >
                                    Day
                                </button>


                                <button
                                    type="button"
                                    className={
                                        timeGrouping ===
                                            "week"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setTimeGrouping(
                                            "week"
                                        )
                                    }
                                >
                                    Week
                                </button>


                                <button
                                    type="button"
                                    className={
                                        timeGrouping ===
                                            "month"
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setTimeGrouping(
                                            "month"
                                        )
                                    }
                                >
                                    Month
                                </button>

                            </div>

                        </div>


                        {analyticsLoading ? (

                            <div className="admin-reporting-panel-message">
                                Loading...
                            </div>

                        ) : issuesSolvedOverTime.length === 0 ? (

                            <div className="admin-reporting-panel-message">
                                No issues were closed during the
                                selected period.
                            </div>

                        ) : (

                            <div className="admin-reporting-time-chart">

                                {issuesSolvedOverTime.map(
                                    (item) => {

                                        const maximum =
                                            getMaximumCount(
                                                issuesSolvedOverTime
                                            );

                                        const height =
                                            maximum > 0
                                                ? Math.max(
                                                    (
                                                        Number(
                                                            item.count ||
                                                            0
                                                        ) /
                                                        maximum
                                                    ) * 100,
                                                    5
                                                )
                                                : 0;

                                        return (
                                            <div
                                                className="admin-reporting-chart-column"
                                                key={`${item.date}-${item.label}`}
                                            >

                                                <div className="admin-reporting-chart-value">
                                                    {item.count}
                                                </div>

                                                <div className="admin-reporting-chart-bar-container">

                                                    <div
                                                        className="admin-reporting-chart-bar admin-reporting-solved-chart-bar"
                                                        style={{
                                                            height:
                                                                `${height}%`,
                                                        }}
                                                    />

                                                </div>

                                                <div className="admin-reporting-chart-label">
                                                    {item.label ||
                                                        formatDate(
                                                            item.date
                                                        )}
                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        )}


                        {getFilterLabel() && (

                            <p className="admin-reporting-chart-filters">
                                {getFilterLabel()}
                            </p>

                        )}

                    </section>


                    {/* =================================================
                        PRIORITY / AGE
                    ================================================== */}

                    <div className="admin-reporting-two-column">


                        {/* PRIORITY */}

                        <section className="admin-reporting-panel">

                            <div className="admin-reporting-panel-header">

                                <div>

                                    <h2>
                                        Issues by Priority
                                    </h2>

                                    <p>
                                        Distribution by issue
                                        priority.
                                    </p>

                                </div>

                            </div>


                            {analyticsLoading ? (

                                <div className="admin-reporting-panel-message">
                                    Loading...
                                </div>

                            ) : (

                                <PieChart
                                    items={
                                        reportsByPriority
                                    }
                                    labelKey="priority"
                                />

                            )}


                            {getFilterLabel() && (

                                <p className="admin-reporting-chart-filters">
                                    {getFilterLabel()}
                                </p>

                            )}

                        </section>


                        {/* AGE */}

                        <section className="admin-reporting-panel">

                            <div className="admin-reporting-panel-header">

                                <div>

                                    <h2>
                                        Unresolved Issues by Age
                                    </h2>

                                    <p>
                                        Active issues grouped by
                                        how long they have remained
                                        unresolved.
                                    </p>

                                </div>

                            </div>


                            {analyticsLoading ? (

                                <div className="admin-reporting-panel-message">
                                    Loading...
                                </div>

                            ) : (

                                <HorizontalBarChart
                                    items={
                                        unresolvedIssuesByAge
                                    }
                                    labelKey="ageGroup"
                                    emptyMessage="No unresolved issues found."
                                />

                            )}


                            {getFilterLabel() && (

                                <p className="admin-reporting-chart-filters">
                                    {getFilterLabel()}
                                </p>

                            )}

                        </section>

                    </div>


                    {/* =================================================
                        ERROR
                    ================================================== */}

                    {analyticsError && (

                        <div className="admin-reporting-error">
                            {analyticsError}
                        </div>

                    )}


                    {/* =================================================
                        PRINT-ONLY EXECUTIVE REPORT
                    ================================================== */}

                    <section className="admin-reporting-print-sheet">


                        {/* -------------------------------------------------
                            PRINT HEADER
                        ------------------------------------------------- */}

                        <div className="admin-reporting-print-header">

                            <div className="admin-reporting-print-header-main">

                                <div className="admin-reporting-print-uon-mark">
                                    UON
                                </div>

                                <div>

                                    <p className="admin-reporting-print-eyebrow">
                                        UNIVERSITY OF NEWCASTLE
                                    </p>

                                    <h1>
                                        WHS Executive Summary
                                    </h1>

                                    <p className="admin-reporting-print-subtitle">
                                        Workplace Health & Safety
                                        Reporting
                                    </p>

                                </div>

                            </div>


                            <div className="admin-reporting-print-date">

                                <span>
                                    Generated
                                </span>

                                <strong>
                                    {formatDate(
                                        new Date()
                                    )}
                                </strong>

                            </div>

                        </div>


                        {/* -------------------------------------------------
                            FILTER SUMMARY
                        ------------------------------------------------- */}

                        <div className="admin-reporting-print-filter-summary">

                            <div>

                                <span>
                                    Reporting period
                                </span>

                                <strong>
                                    {getPrintPeriod()}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Campus
                                </span>

                                <strong>
                                    {getPrintFilterLabel(
                                        "Campus",
                                        appliedFilters.campus
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {getPrintFilterLabel(
                                        "Status",
                                        appliedFilters.status
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Priority
                                </span>

                                <strong>
                                    {getPrintFilterLabel(
                                        "Priority",
                                        appliedFilters.priority
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    User type
                                </span>

                                <strong>
                                    {getPrintFilterLabel(
                                        "User type",
                                        appliedFilters.role
                                    )}
                                </strong>

                            </div>

                        </div>


                        {/* -------------------------------------------------
                            EXECUTIVE SUMMARY
                        ------------------------------------------------- */}

                        <div className="admin-reporting-print-summary">

                            <h2>
                                WHS Executive Summary
                            </h2>

                            <p>
                                This report provides an overview
                                of workplace health and safety
                                issues reported within the selected
                                reporting period and filter criteria.
                                It summarises issue distribution,
                                reporting trends, resolution activity
                                and unresolved issues requiring
                                attention.
                            </p>

                        </div>


                        {/* -------------------------------------------------
                            ISSUE DISTRIBUTION
                        ------------------------------------------------- */}

                        <section className="admin-reporting-print-section">

                            <h2>
                                Issue Distribution
                            </h2>


                            <div className="admin-reporting-print-chart-grid">

                                <PrintDonutChart
                                    title="Issues by Status"
                                    items={
                                        reportsByStatus
                                    }
                                    labelKey="status"
                                />


                                {appliedFilters.campus ===
                                    "All" && (

                                        <PrintDonutChart
                                            title="Issues by Campus"
                                            items={
                                                reportsByCampus
                                            }
                                            labelKey="campus"
                                        />

                                    )}


                                <PrintDonutChart
                                    title="Issues by Priority"
                                    items={
                                        reportsByPriority
                                    }
                                    labelKey="priority"
                                />

                            </div>

                        </section>


                        {/* -------------------------------------------------
                            REPORTING TRENDS
                        ------------------------------------------------- */}

                        <section className="admin-reporting-print-section">

                            <h2>
                                Reporting Trends
                            </h2>


                            <div className="admin-reporting-print-chart-grid">

                                <PrintTimeChart
                                    title="Issues Reported Over Time"
                                    items={
                                        reportsOverTime
                                    }
                                    emptyMessage="No reports found for the selected filters."
                                    barColour="#0758d7"
                                />


                                <PrintTimeChart
                                    title="Issues Solved Over Time"
                                    items={
                                        issuesSolvedOverTime
                                    }
                                    emptyMessage="No issues were closed during the selected period."
                                    barColour="#15803d"
                                />

                            </div>

                        </section>


                        {/* -------------------------------------------------
                            UNRESOLVED ISSUE AGEING
                        ------------------------------------------------- */}

                        <section className="admin-reporting-print-section">

                            <h2>
                                Unresolved Issue Ageing
                            </h2>


                            <div className="admin-reporting-print-chart-grid">

                                <PrintHorizontalBarChart
                                    title="Unresolved Issues by Age"
                                    items={
                                        unresolvedIssuesByAge
                                    }
                                    labelKey="ageGroup"
                                />

                            </div>

                        </section>


                        {/* -------------------------------------------------
                            ISSUES REQUIRING ATTENTION
                        ------------------------------------------------- */}

                        <section className="admin-reporting-print-section">

                            <h2>
                                Issues Requiring Attention
                            </h2>


                            <PrintTable
                                headers={[
                                    "Issue",
                                    "Campus",
                                    "Date Reported",
                                    "Age",
                                    "Priority",
                                    "Status",
                                    "Assigned To",
                                ]}
                                rows={
                                    issuesRequiringAttention
                                        .slice(0, 5)
                                        .map(
                                            (issue) => [

                                                issue.title ||
                                                "Untitled issue",

                                                issue.campus ||
                                                "Unknown",

                                                formatDate(
                                                    issue.dateTimeReported
                                                ),

                                                formatAge(
                                                    issue.ageDays
                                                ),

                                                issue.priority ||
                                                "Unknown",

                                                issue.status ||
                                                "Unknown",

                                                getAssigneeLabel(
                                                    issue
                                                ),

                                            ]
                                        )
                                }
                            />

                        </section>


                        {/* -------------------------------------------------
                            PRINT FOOTER
                        ------------------------------------------------- */}

                        <footer className="admin-reporting-print-footer">

                            <span>
                                University of Newcastle
                                · Workplace Health & Safety
                            </span>

                            <span>
                                WHS Executive Summary
                            </span>

                        </footer>

                    </section>

                </main>

            </div>

        </div>
    );
}
