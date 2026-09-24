import styles from "@/components/dashboard/dashboard.module.css";

export default function DashboardLoading() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading dashboard">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonFeatureGrid}>
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonCards}>
          {Array.from({ length: 4 }, (_, index) => (
            <div className={styles.skeletonCard} key={index} />
          ))}
        </div>
      </div>
      <div className={styles.skeletonPanels}>
        <div className={styles.skeletonPanel} />
        <div className={styles.skeletonPanel} />
      </div>
      <span className="sr-only">Loading live business metrics</span>
    </div>
  );
}
