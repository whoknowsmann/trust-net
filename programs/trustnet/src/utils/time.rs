pub fn days_between(now_ts: i64, then_ts: i64) -> i64 {
    let diff = now_ts.saturating_sub(then_ts);
    diff / 86_400
}
