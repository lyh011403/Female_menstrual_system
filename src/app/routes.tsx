import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { CalendarInsights } from "./pages/CalendarInsights";
import { Tools } from "./pages/Tools";
import { DietRecord } from "./pages/DietRecord";
import { PartnerSystem } from "./pages/PartnerSystem";
import { NotificationSettings } from "./pages/NotificationSettings";
import { PrivacySettings } from "./pages/PrivacySettings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "calendar", Component: CalendarInsights },
      { path: "tools", Component: Tools },
      { path: "diet", Component: DietRecord },
      { path: "partner", Component: PartnerSystem },
      { path: "settings/notifications", Component: NotificationSettings },
      { path: "settings/privacy", Component: PrivacySettings },
    ],
  },
]);
