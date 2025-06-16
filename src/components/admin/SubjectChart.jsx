import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export const SubjectChart = ({ data, title, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                <XAxis
                    dataKey="subject"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: "10px",
                        padding: "8px 12px",
                        fontSize: "14px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
                        border: "1px solid #e5e7eb",
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar
                    dataKey="count"
                    fill={color}
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                />
            </BarChart>
        </ResponsiveContainer>
    </div>
); export default SubjectChart