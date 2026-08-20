import { useAuth } from "@context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { useVerifyCode } from "./useVerifyCode";

export type VerificationStatus = "idle" | "loading" | "success" | "error";

export interface UseCodeVerificationOptions {
  onVerificationSuccess?: (token: string) => void;
  onVerificationError?: (error: string) => void;
}

export const useCodeVerification = ({
  onVerificationSuccess,
  onVerificationError,
}: UseCodeVerificationOptions = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: verify } = useVerifyCode();
  const { setToken } = useAuth();

  const { code: codeFromUrl } = useParams();

  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [token, setReceivedToken] = useState<string | null>(null);

  const verificationStarted = useRef(false);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorMsg(null);
    verificationStarted.current = false;
  }, []);

  const performVerification = useCallback(
    async (verificationCode: string) => {
      if (status === "loading" || status === "success") return;

      setStatus("loading");
      setErrorMsg(null);

      try {
        const data = await verify({ verification_code: verificationCode });
        const receivedToken = data?.token || "";

        setStatus("success");
        setReceivedToken(receivedToken);

        if (receivedToken) {
          localStorage.setItem("user_status", "VERIFIED_PENDING_DETAILS");
          localStorage.setItem("token", receivedToken);
          setToken(receivedToken);
        }

        onVerificationSuccess?.(receivedToken);

        const timer = setTimeout(() => {
          navigate("/register-details");
        }, 1500);

        return () => clearTimeout(timer);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t("auth.verify.error.invalidCode");
        setStatus("error");
        setErrorMsg(msg);
        onVerificationError?.(msg);
      }
    },
    [
      status,
      verify,
      setToken,
      onVerificationSuccess,
      onVerificationError,
      navigate,
      t,
    ],
  );

  useEffect(() => {
    if (location.state?.fromSignUp) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    if (!codeFromUrl) {
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;
    performVerification(codeFromUrl);
  }, [codeFromUrl, performVerification]);

  return {
    codeFromUrl,
    errorMsg,
    performVerification,
    reset,
    showToast,
    status,
    token,
  };
};
