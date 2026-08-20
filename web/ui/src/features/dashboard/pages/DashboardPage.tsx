import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const status = localStorage.getItem("user_status");
    if (status === "VERIFIED_PENDING_DETAILS") {
      navigate("/user/register", { replace: true });
    }
  }, [navigate]);

  return "hello";
}
