import React from "react";
import { useAuth } from "@context/AuthContext";
import DrawerLayout from "./DrawerLayout";
import BaseLayout from "./Layout";

export const ConditionalLayout: React.FC = () => {
  const { token } = useAuth();

  if (token) {
    return <DrawerLayout />;
  }

  return <BaseLayout />;
};

export default ConditionalLayout;
