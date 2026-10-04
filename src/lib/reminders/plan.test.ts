import { describe, expect, it } from "vitest";
import { planEventReminders } from "@/lib/reminders/plan";

const alice = {
  id: "alice",
  display_name: "Alice",
  timezone: "America/New_York",
  calendar_visibility: "friends" as const,
};
const bob = {
  id: "bob",
  display_name: "Bob",
  timezone: "Europe/Berlin",
  calendar_visibility: "friends" as const,
};
const friendship = { requester_id: "alice", addressee_id: "bob" };

describe("planEventReminders", () => {
  it("fires day_of when event date matches recipient local today", () => {
    // 2026-10-04 08:00 UTC = still Oct 4 in Berlin (UTC+2)
    const now = new Date("2026-10-04T08:00:00.000Z");
    const planned = planEventReminders(
      [friendship],
      [alice, bob],
      [
        {
          id: "e1",
          user_id: "alice",
          name: "Birthday",
          event_date: "2026-10-04",
          list_id: null,
        },
      ],
      now,
    );
    const forBob = planned.filter((p) => p.recipientId === "bob");
    expect(forBob).toHaveLength(1);
    expect(forBob[0].kind).toBe("day_of");
  });

  it("fires week_before for event 7 local days ahead", () => {
    const now = new Date("2026-10-04T12:00:00.000Z");
    const planned = planEventReminders(
      [friendship],
      [alice, bob],
      [
        {
          id: "e2",
          user_id: "alice",
          name: "Party",
          event_date: "2026-10-11",
          list_id: "list-1",
        },
      ],
      now,
    );
    const forBob = planned.find((p) => p.recipientId === "bob");
    expect(forBob?.kind).toBe("week_before");
    expect(forBob?.listId).toBe("list-1");
  });

  it("skips private calendars", () => {
    const now = new Date("2026-10-04T12:00:00.000Z");
    const planned = planEventReminders(
      [friendship],
      [{ ...alice, calendar_visibility: "private" }, bob],
      [
        {
          id: "e3",
          user_id: "alice",
          name: "Secret",
          event_date: "2026-10-04",
          list_id: null,
        },
      ],
      now,
    );
    expect(planned.filter((p) => p.recipientId === "bob")).toHaveLength(0);
  });

  it("handles US/EU midnight skew: same UTC instant, different local days", () => {
    // 2026-10-05 02:30 UTC → Oct 4 evening in New York, Oct 5 morning in Berlin
    const now = new Date("2026-10-05T02:30:00.000Z");
    const planned = planEventReminders(
      [friendship],
      [alice, bob],
      [
        {
          id: "e4",
          user_id: "bob",
          name: "Brunch",
          event_date: "2026-10-04",
          list_id: null,
        },
        {
          id: "e5",
          user_id: "bob",
          name: "Meetup",
          event_date: "2026-10-05",
          list_id: null,
        },
      ],
      now,
    );

    const forAlice = planned.filter((p) => p.recipientId === "alice");
    // Alice in NY: local date still 2026-10-04 → day_of for Brunch
    expect(forAlice.some((p) => p.eventId === "e4" && p.kind === "day_of")).toBe(
      true,
    );
    // Not yet Oct 5 for Alice
    expect(forAlice.some((p) => p.eventId === "e5")).toBe(false);
  });

  it("scales linearly for many friendships (smoke performance)", () => {
    const n = 2000;
    const friendships = Array.from({ length: n }, (_, i) => ({
      requester_id: "hub",
      addressee_id: `u${i}`,
    }));
    const profiles = [
      {
        id: "hub",
        display_name: "Hub",
        timezone: "UTC",
        calendar_visibility: "friends" as const,
      },
      ...Array.from({ length: n }, (_, i) => ({
        id: `u${i}`,
        display_name: `User ${i}`,
        timezone: "UTC",
        calendar_visibility: "friends" as const,
      })),
    ];
    const events = [
      {
        id: "party",
        user_id: "hub",
        name: "Party",
        event_date: "2026-10-04",
        list_id: null,
      },
    ];
    const start = performance.now();
    const planned = planEventReminders(
      friendships,
      profiles,
      events,
      new Date("2026-10-04T12:00:00.000Z"),
    );
    const ms = performance.now() - start;
    expect(planned.length).toBe(n);
    expect(ms).toBeLessThan(500);
  });
});
