import { useEffect } from "react";
import { useNavigate } from "react-router";

import LandingView from "../features/listings/components/LandingView";

export default function DashboardPage() {
  const navigate = useNavigate();



  return <LandingView />;
}
