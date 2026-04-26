// **Feature: property-dealer-crm, Property 18: Real-time events emitted on lead mutations**
// **Validates: Requirements 9.1, 9.2, 9.3**
import * as fc from "fast-check";
import { EventEmitter } from "events";

/**
 * We test the RealtimeService by mocking the Socket.io server with a simple
 * EventEmitter-based spy. This validates that the correct events are emitted
 * to the correct rooms without needing a real Socket.io connection.
 */

// Mock socket.ts before importing realtimeService
const emittedEvents: Array<{ room: string | null; event: string; data: unknown }> = [];

const mockIO = {
  to: (room: string) => ({
    emit: (event: string, data: unknown) => {
      emittedEvents.push({ room, event, data });
    },
  }),
  emit: (event: string, data: unknown) => {
    emittedEvents.push({ room: null, event, data });
  },
};

jest.mock("@/lib/socket", () => ({
  getIOSafe: () => mockIO,
}));

import { emitLeadCreated, emitLeadAssigned, emitScoreChanged } from "@/services/realtimeService";

function makeFakeLead(budget: number) {
  return { _id: "lead123", name: "Test", budget, score: budget > 20_000_000 ? "High" : "Low" } as any;
}

beforeEach(() => {
  emittedEvents.length = 0;
});

describe("Property 18: Real-time events emitted on lead mutations", () => {
  it("emitLeadCreated sends lead:created to admins room for any lead", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000_000 }), (budget) => {
        emittedEvents.length = 0;
        const lead = makeFakeLead(budget);
        emitLeadCreated(lead);
        const adminEvent = emittedEvents.find((e) => e.room === "admins" && e.event === "lead:created");
        expect(adminEvent).toBeDefined();
        expect((adminEvent!.data as any).lead).toBe(lead);
      }),
      { numRuns: 100 }
    );
  });

  it("emitLeadAssigned sends lead:assigned to admins and agent room for any agentId", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.integer({ min: 0, max: 100_000_000 }), (agentId, budget) => {
        emittedEvents.length = 0;
        const lead = makeFakeLead(budget);
        emitLeadAssigned(lead, agentId);

        const adminEvent = emittedEvents.find((e) => e.room === "admins" && e.event === "lead:assigned");
        const agentEvent = emittedEvents.find((e) => e.room === `agent:${agentId}` && e.event === "lead:assigned");

        expect(adminEvent).toBeDefined();
        expect(agentEvent).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("emitScoreChanged broadcasts lead:scoreChanged to all clients for any lead", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000_000 }), (budget) => {
        emittedEvents.length = 0;
        const lead = makeFakeLead(budget);
        emitScoreChanged(lead);

        const broadcastEvent = emittedEvents.find((e) => e.room === null && e.event === "lead:scoreChanged");
        expect(broadcastEvent).toBeDefined();
        expect((broadcastEvent!.data as any).lead).toBe(lead);
      }),
      { numRuns: 100 }
    );
  });
});
