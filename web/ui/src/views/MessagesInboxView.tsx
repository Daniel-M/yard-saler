import { useAuth } from "@context/AuthContext";
import { ArrowLeft, Check, CheckCheck, MessageSquare, Send, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";

import {
  useMarkThreadAsRead,
  useMessageHistory,
  useMessageThreads,
  useSendMessage,
} from "../hooks/useMessaging";

const getInitials = (name?: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function MessagesInboxView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    threads,
    isLoading: threadsLoading,
    refetch: refetchThreads,
  } = useMessageThreads();
  const [searchParams, setSearchParams] = useSearchParams();
  const threadIdFromParam = searchParams.get("thread_id");
  const navigate = useNavigate();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    threadIdFromParam,
  );
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    threadIdFromParam ? "chat" : "list",
  );
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (threadIdFromParam) {
      setActiveThreadId(threadIdFromParam);
      setMobileView("chat");
    } else {
      setActiveThreadId(null);
      setMobileView("list");
    }
  }, [threadIdFromParam]);

  const {
    detail,
    isLoading: historyLoading,
    refetch: refetchHistory,
    addOptimisticMessage,
  } = useMessageHistory(activeThreadId || "");

  const { sendMessage, isLoading: sending } = useSendMessage(
    activeThreadId || "",
  );
  const { markAsRead } = useMarkThreadAsRead();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  useEffect(() => {
    if (activeThreadId) {
      markAsRead(activeThreadId).then(() => {
        refetchThreads();
      });
    }
  }, [activeThreadId, markAsRead, refetchThreads]);

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setMobileView("chat");
    setSearchParams({ thread_id: threadId });
  };

  const handleBackToInbox = () => {
    setMobileView("list");
    setActiveThreadId(null);
    setSearchParams({});
    refetchThreads();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || sending || !activeThreadId) return;

    setInputText("");

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id || "",
      content: textToSend,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    addOptimisticMessage(optimisticMsg);

    try {
      await sendMessage(textToSend);
      refetchHistory();
      refetchThreads();
    } catch (err) {
      console.error("Failed to send message", err);
      refetchHistory();
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const activeEventCode = detail?.event_code || activeThread?.event_code;
  const activeProductCode = detail?.product_code || activeThread?.product_code;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[var(--canvas)]">
      {/* Thread List Column */}
      <div
        className={`w-full lg:w-1/3 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--surface)] ${
          mobileView === "chat" ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--content-primary)]">
            {t("messaging.title")}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threadsLoading && threads.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-[var(--content-secondary)]">
              {t("common.loading")}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--content-secondary)] h-64">
              <MessageSquare className="h-12 w-12 mb-3 opacity-40 text-[var(--content-secondary)]" />
              <p className="text-sm font-medium">
                {t("messaging.no_conversations")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <li key={thread.id}>
                    <button
                      onClick={() => handleSelectThread(thread.id)}
                      className={`w-full p-4 text-left transition-colors duration-150 flex gap-3 items-start hover:bg-[var(--surface-elevated)] ${
                        isActive
                          ? "bg-[var(--surface-elevated)] border-l-4 border-cyan-500"
                          : ""
                      }`}
                    >
                      {thread.avatarUrl ? (
                        <img
                          src={thread.avatarUrl}
                          alt={thread.other_user_name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-[var(--border-subtle)]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {getInitials(thread.other_user_name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-[var(--content-primary)] truncate">
                            {thread.other_user_name}
                          </span>
                          <span className="text-xs text-[var(--content-secondary)]">
                            {new Date(
                              thread.last_message_at,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (thread.event_code && thread.product_code) {
                              navigate(
                                `/ys/e/${thread.event_code}/p/${thread.product_code}`,
                              );
                            }
                          }}
                          className="inline-block text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline mb-1 cursor-pointer"
                        >
                          {t("messaging.product_label")} {thread.product_name}
                        </span>
                        <p className="text-sm text-[var(--content-secondary)] truncate">
                          {thread.last_message}
                        </p>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="bg-rose-500 text-white rounded-full text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {thread.unread_count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Chat History Column */}
      <div
        className={`w-full lg:w-2/3 flex flex-col bg-[var(--canvas)] ${
          mobileView === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        {activeThreadId ? (
          <>
            <div className="p-4 bg-[var(--surface)] border-b border-[var(--border-subtle)] flex items-center gap-3">
              <button
                onClick={handleBackToInbox}
                className="lg:hidden p-2 -ml-2 text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-lg hover:bg-[var(--surface-elevated)]"
                aria-label={t("messaging.back_to_inbox")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {detail?.avatarUrl || activeThread?.avatarUrl ? (
                <img
                  src={detail?.avatarUrl || activeThread?.avatarUrl}
                  alt={detail?.other_user_name || activeThread?.other_user_name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(
                    detail?.other_user_name || activeThread?.other_user_name,
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[var(--content-primary)] truncate">
                  {detail?.other_user_name || activeThread?.other_user_name}
                </h3>
                <p className="text-xs text-[var(--content-secondary)] truncate">
                  {t("messaging.product_label")}{" "}
                  {activeEventCode && activeProductCode ? (
                    <Link
                      to={`/ys/e/${activeEventCode}/p/${activeProductCode}`}
                      className="font-medium text-cyan-400 hover:underline"
                    >
                      {detail?.product_name || activeThread?.product_name}
                    </Link>
                  ) : (
                    <span className="font-medium text-cyan-400">
                      {detail?.product_name || activeThread?.product_name}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {historyLoading && !detail ? (
                <div className="flex items-center justify-center h-full text-[var(--content-secondary)]">
                  {t("common.loading")}
                </div>
              ) : (
                detail?.messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${
                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-accent-purple/20 text-[var(--content-primary)] border border-accent-purple/30 rounded-tr-none"
                            : "bg-[var(--surface-elevated)] text-[var(--content-primary)] border border-[var(--border-subtle)] rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--content-secondary)] mt-1 px-1">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && (
                          <span
                            className="flex items-center gap-0.5"
                            title={msg.read_at ? t("messaging.read") : t("messaging.sent")}
                          >
                            {msg.read_at ? (
                              <CheckCheck className="h-3 w-3 text-cyan-400" />
                            ) : (
                              <Check className="h-3 w-3 text-[var(--content-secondary)]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 bg-[var(--surface)] border-t border-[var(--border-subtle)] flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("messaging.placeholder")}
                disabled={sending}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--canvas)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{t("messaging.send")}</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--content-secondary)]">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20 text-[var(--content-secondary)]" />
            <h3 className="text-lg font-bold mb-1">{t("messaging.title")}</h3>
            <p className="text-sm max-w-xs">
              {t("messaging.select_conversation")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
