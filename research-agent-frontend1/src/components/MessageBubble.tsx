import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../types";

type Props = {
  message: ChatMessage;
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="research-message user-request">
        <div className="request-label">
          <span className="request-dot" />
          USER REQUEST
        </div>
        <div className="user-request-box">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="research-message agent-response">
      <div className="response-label">
        <div className="response-blackhole">
          <div className="response-blackhole-core" />
          <div className="response-blackhole-ring" />
          <div className="response-blackhole-glow" />
        </div>
        <span>RESEARCH AGENT</span>
      </div>

      <div className="agent-response-box">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}