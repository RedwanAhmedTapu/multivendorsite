// Agent conversations moved into the unified admin Live Chat page.
import { redirect } from "next/navigation";

export default function AgentMessagesRedirect() {
  redirect("/admin-dashboard/chat?tab=agents");
}
