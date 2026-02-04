use anchor_lang::prelude::*;

pub fn integer_sqrt(value: u64) -> u64 {
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}

pub fn compute_rating_average(current_avg: u16, current_count: u64, new_score: u8) -> u16 {
    let total = current_avg as u64 * current_count;
    let new_total = total + (new_score as u64 * 100);
    let new_count = current_count + 1;
    (new_total / new_count) as u16
}

pub fn clamp_u8(value: i64, min: i64, max: i64) -> u8 {
    value.clamp(min, max) as u8
}

pub fn forgetting_multiplier(days_inactive: i64) -> u16 {
    match days_inactive {
        d if d <= 30 => 100,
        d if d <= 90 => 95,
        d if d <= 180 => 90,
        d if d <= 360 => 80,
        _ => 70,
    }
}

pub fn compute_reputation_score(
    completed: u64,
    failed: u64,
    disputes_won: u64,
    disputes_lost: u64,
    stake_lamports: u64,
    days_inactive: i64,
) -> u8 {
    let total_jobs = completed + failed;
    let mut base = if total_jobs == 0 {
        0
    } else {
        (completed * 100 / total_jobs) as i64
    };
    base += (disputes_won as i64) * 2;
    base -= (disputes_lost as i64) * 5;
    let volume_bonus = if completed >= 50 {
        15
    } else if completed >= 20 {
        10
    } else if completed >= 5 {
        5
    } else {
        0
    };
    base += volume_bonus;
    let stake_sol = stake_lamports / 1_000_000_000;
    let stake_bonus = if stake_sol >= 50 {
        10
    } else if stake_sol >= 10 {
        5
    } else if stake_sol >= 1 {
        2
    } else {
        0
    };
    base += stake_bonus;
    let multiplier = forgetting_multiplier(days_inactive) as i64;
    let adjusted = base * multiplier / 100;
    clamp_u8(adjusted, 0, 100)
}
