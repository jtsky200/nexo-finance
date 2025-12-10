import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "../../../functions/src/trpc";

export const trpc = createTRPCReact<AppRouter>();
