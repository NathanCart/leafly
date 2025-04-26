drop policy "Users can read own plant images" on "public"."plant_images";

drop policy "Users can create plant images" on "public"."plant_images";

drop policy "Users can delete own plant images" on "public"."plant_images";

drop policy "Users can update own plant images" on "public"."plant_images";

create table "public"."plant_health_reports" (
    "id" uuid not null default gen_random_uuid(),
    "plant_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid default gen_random_uuid(),
    "raw" json not null,
    "image_url" text not null
);


alter table "public"."plant_health_reports" enable row level security;

alter table "public"."plant_images" add column "user_id" uuid default gen_random_uuid();

alter table "public"."plants" add column "fertilize_interval_days" bigint;

alter table "public"."plants" add column "last_fertilized" date;

alter table "public"."plants" add column "last_watered" date;

alter table "public"."plants" add column "raw" json;

alter table "public"."plants" add column "watering_interval_days" bigint;

CREATE UNIQUE INDEX plant_health_reports_pkey ON public.plant_health_reports USING btree (id);

alter table "public"."plant_health_reports" add constraint "plant_health_reports_pkey" PRIMARY KEY using index "plant_health_reports_pkey";

alter table "public"."plant_health_reports" add constraint "plant_health_reports_plant_id_fkey" FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE not valid;

alter table "public"."plant_health_reports" validate constraint "plant_health_reports_plant_id_fkey";

alter table "public"."plant_health_reports" add constraint "plant_health_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."plant_health_reports" validate constraint "plant_health_reports_user_id_fkey";

alter table "public"."plant_images" add constraint "plant_images_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."plant_images" validate constraint "plant_images_user_id_fkey";

grant delete on table "public"."plant_health_reports" to "anon";

grant insert on table "public"."plant_health_reports" to "anon";

grant references on table "public"."plant_health_reports" to "anon";

grant select on table "public"."plant_health_reports" to "anon";

grant trigger on table "public"."plant_health_reports" to "anon";

grant truncate on table "public"."plant_health_reports" to "anon";

grant update on table "public"."plant_health_reports" to "anon";

grant delete on table "public"."plant_health_reports" to "authenticated";

grant insert on table "public"."plant_health_reports" to "authenticated";

grant references on table "public"."plant_health_reports" to "authenticated";

grant select on table "public"."plant_health_reports" to "authenticated";

grant trigger on table "public"."plant_health_reports" to "authenticated";

grant truncate on table "public"."plant_health_reports" to "authenticated";

grant update on table "public"."plant_health_reports" to "authenticated";

grant delete on table "public"."plant_health_reports" to "service_role";

grant insert on table "public"."plant_health_reports" to "service_role";

grant references on table "public"."plant_health_reports" to "service_role";

grant select on table "public"."plant_health_reports" to "service_role";

grant trigger on table "public"."plant_health_reports" to "service_role";

grant truncate on table "public"."plant_health_reports" to "service_role";

grant update on table "public"."plant_health_reports" to "service_role";

create policy "Enable delete for users based on user_id"
on "public"."plant_health_reports"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Enable insert for authenticated users only"
on "public"."plant_health_reports"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Enable read access for all users"
on "public"."plant_health_reports"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."plant_images"
as permissive
for select
to public
using (true);


create policy "Users can create plant images"
on "public"."plant_images"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Users can delete own plant images"
on "public"."plant_images"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Users can update own plant images"
on "public"."plant_images"
as permissive
for update
to authenticated
using ((user_id = auth.uid()));



