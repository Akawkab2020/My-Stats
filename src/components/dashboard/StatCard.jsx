import React from "react";
import Card from "../ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon: Icon,
  color,
}) => {
  return (
    <Card className="relative overflow-hidden group">
      {/* Accent border on the side */}
      <div
        className="absolute top-0 right-0 w-1.5 h-full"
        style={{ backgroundColor: color }}
      />

      <div className="flex justify-between items-start">
        <div>
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3
              className="text-2xl font-black"
              style={{ color: "var(--color-text)" }}
            >
              {value}
            </h3>
            {subValue && (
              <span
                className="text-sm font-bold"
                style={{ color: "var(--color-text-muted)" }}
              >
                {subValue}
              </span>
            )}
          </div>

          {trend && (
            <div className="flex items-center gap-1 mt-3">
              <div
                className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  trend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {trend === "up" ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingDown size={10} />
                )}
                <span>{trendValue}</span>
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                نمو عن الشهر السابق
              </span>
            </div>
          )}
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={20} />
        </div>
      </div>

      {/* Decorative background element */}
      <div
        className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-[0.03]"
        style={{ backgroundColor: color }}
      />
    </Card>
  );
};

export default StatCard;
