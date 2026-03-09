import { createElement } from "react";
import { getWeatherIcon } from "./weather-icons";

interface WeatherIconProps {
  wx: string;
  className?: string;
}

export default function WeatherIcon({ wx, className }: WeatherIconProps) {
  return createElement(getWeatherIcon(wx), { className });
}
