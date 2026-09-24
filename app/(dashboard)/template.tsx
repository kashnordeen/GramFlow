import styles from "./dashboard.module.css";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className={styles.routeFrame}>{children}</div>;
}
