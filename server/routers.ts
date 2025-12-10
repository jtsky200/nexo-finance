import { COOKIE_NAME } from "@shared/const";

import { z } from "zod";

import * as db from "./db";

import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  reminders: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(['offen', 'erledigt', 'überfällig']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserReminders(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        type: z.enum(['termin', 'zahlung', 'aufgabe']),
        dueDate: z.date(),
        isAllDay: z.boolean().default(false),
        amount: z.number().optional(),
        currency: z.string().optional(),
        recurrenceRule: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createReminder({
          ...input,
          userId: ctx.user.id,
          status: 'offen',
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        type: z.enum(['termin', 'zahlung', 'aufgabe']).optional(),
        dueDate: z.date().optional(),
        isAllDay: z.boolean().optional(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        recurrenceRule: z.string().optional(),
        status: z.enum(['offen', 'erledigt', 'überfällig']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateReminder(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteReminder(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  finance: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(['einnahme', 'ausgabe']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserFinanceEntries(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        type: z.enum(['einnahme', 'ausgabe']),
        category: z.string().min(1),
        amount: z.number().int().positive(),
        currency: z.string().length(3),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurrenceRule: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createFinanceEntry({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.date().optional(),
        type: z.enum(['einnahme', 'ausgabe']).optional(),
        category: z.string().optional(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurrenceRule: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateFinanceEntry(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFinanceEntry(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  taxes: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserTaxProfiles(ctx.user.id);
      }),
    
    getByYear: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTaxProfileByYear(ctx.user.id, input.year);
      }),
    
    create: protectedProcedure
      .input(z.object({
        taxYear: z.number(),
        canton: z.string().optional(),
        maritalStatus: z.string().optional(),
        numberOfChildren: z.number().optional(),
        grossIncome: z.number().optional(),
        otherIncome: z.number().optional(),
        deductions: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTaxProfile({
          ...input,
          userId: ctx.user.id,
          country: 'CH',
          status: 'unvollständig',
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        canton: z.string().optional(),
        status: z.enum(['unvollständig', 'vollständig', 'archiviert']).optional(),
        maritalStatus: z.string().optional(),
        numberOfChildren: z.number().optional(),
        grossIncome: z.number().optional(),
        otherIncome: z.number().optional(),
        deductions: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateTaxProfile(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTaxProfile(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  user: router({
    updatePreferences: protectedProcedure
      .input(z.object({
        locale: z.string().optional(),
        defaultCurrency: z.string().optional(),
        canton: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Convert frontend messages to LLM format
        const llmMessages = input.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }));

        try {
          const result = await invokeLLM({
            messages: llmMessages,
          });

          // Extract the assistant's response
          const assistantMessage = result.choices[0]?.message;
          if (!assistantMessage) {
            throw new Error('No response from AI');
          }

          // Handle both string and array content
          const content = typeof assistantMessage.content === 'string'
            ? assistantMessage.content
            : Array.isArray(assistantMessage.content)
            ? assistantMessage.content
                .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
                .map(c => c.text)
                .join('\n')
            : 'Keine Antwort erhalten';

          return {
            content,
            usage: result.usage,
          };
        } catch (error) {
          throw new Error(
            error instanceof Error ? error.message : 'AI request failed'
          );
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
