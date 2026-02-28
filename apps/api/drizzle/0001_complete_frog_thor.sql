ALTER TABLE "pass_events" DROP CONSTRAINT "pass_events_route_line_id_stop_rank_car_unique";--> statement-breakpoint
ALTER TABLE "pass_events" ADD COLUMN "route_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "pass_events" ADD CONSTRAINT "pass_events_route_line_id_stop_rank_car_route_date_unique" UNIQUE("route_line_id","stop_rank","car","route_date");