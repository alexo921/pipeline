--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CertificationStatus; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."CertificationStatus" AS ENUM (
    'Certified',
    'NotCertified',
    'Pending',
    'Inprogress'
);


ALTER TYPE public."CertificationStatus" OWNER TO pipeline_admin;

--
-- Name: HealthcareRole; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."HealthcareRole" AS ENUM (
    'CNA',
    'LPN',
    'RN',
    'PCA',
    'HHA',
    'OTHER'
);


ALTER TYPE public."HealthcareRole" OWNER TO pipeline_admin;

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."JobStatus" AS ENUM (
    'WorkingFullTime',
    'WorkingFullTimeAvailable',
    'WorkingPartTimeAvailable',
    'NotWorkingAvailable',
    'NotWorkingOpenOffers'
);


ALTER TYPE public."JobStatus" OWNER TO pipeline_admin;

--
-- Name: OnboardingStep; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."OnboardingStep" AS ENUM (
    'INITIAL_DETAILS',
    'LOCATION_DETAILS',
    'AVAILABILITY_DETAILS'
);


ALTER TYPE public."OnboardingStep" OWNER TO pipeline_admin;

--
-- Name: PreferredSetting; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."PreferredSetting" AS ENUM (
    'LTC',
    'HomeCare',
    'Hospital',
    'Rehab',
    'Open'
);


ALTER TYPE public."PreferredSetting" OWNER TO pipeline_admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."Role" AS ENUM (
    'CANDIDATE',
    'EMPLOYER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO pipeline_admin;

--
-- Name: ShiftType; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."ShiftType" AS ENUM (
    'Day',
    'Night',
    'Weekend',
    'Overnight',
    'Flexible'
);


ALTER TYPE public."ShiftType" OWNER TO pipeline_admin;

--
-- Name: ThrivingFactor; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."ThrivingFactor" AS ENUM (
    'FriendlyTeam',
    'ClearOnboarding',
    'FlexibleSchedule',
    'HigherPay',
    'ManageableLoad',
    'CareerGrowth'
);


ALTER TYPE public."ThrivingFactor" OWNER TO pipeline_admin;

--
-- Name: WorkSettingExperience; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."WorkSettingExperience" AS ENUM (
    'LTC',
    'HomeCare',
    'Hospital',
    'Rehab',
    'StartingOut'
);


ALTER TYPE public."WorkSettingExperience" OWNER TO pipeline_admin;

--
-- Name: WorkType; Type: TYPE; Schema: public; Owner: pipeline_admin
--

CREATE TYPE public."WorkType" AS ENUM (
    'FullTime',
    'PartTime',
    'PerDiem',
    'LiveIn'
);


ALTER TYPE public."WorkType" OWNER TO pipeline_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO pipeline_admin;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.candidates (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "userId" text NOT NULL,
    "healthcareRole" public."HealthcareRole" NOT NULL,
    "certificationStatus" public."CertificationStatus" NOT NULL,
    "zipCode" text,
    address text,
    "maxTravelDistance" integer,
    "workType" public."WorkType"[],
    "shiftType" public."ShiftType"[],
    "currentJobStatus" public."JobStatus",
    step public."OnboardingStep" NOT NULL,
    "isOnboarded" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "hourlyRate" integer,
    "yearlySalary" integer,
    "payLocationBased" boolean DEFAULT false NOT NULL,
    "workSettingExperience" public."WorkSettingExperience"[],
    "preferredSetting" public."PreferredSetting"[],
    "thrivingFactors" public."ThrivingFactor"[],
    "jobFrustationNotes" text,
    "referredBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.candidates OWNER TO pipeline_admin;

--
-- Name: experiences; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.experiences (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    employer text NOT NULL,
    role text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isCurrent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.experiences OWNER TO pipeline_admin;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name character varying NOT NULL,
    description character varying,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    "startDate" date,
    "endDate" date,
    "createdAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.projects OWNER TO pipeline_admin;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "projectId" text,
    "assignedToId" text
);


ALTER TABLE public.tasks OWNER TO pipeline_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'CANDIDATE'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO pipeline_admin;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1a5cc5bb-7a17-4712-b31d-e878beeb6c4a	5920f64bfa0e00e9e9df159c68ab074d1f5f9c396b160eb2c4863a0a242ae125	2025-07-09 19:23:24.655987+00	20250622155241_init	\N	\N	2025-07-09 19:23:24.564905+00	1
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.candidates (id, name, email, "userId", "healthcareRole", "certificationStatus", "zipCode", address, "maxTravelDistance", "workType", "shiftType", "currentJobStatus", step, "isOnboarded", "isActive", "hourlyRate", "yearlySalary", "payLocationBased", "workSettingExperience", "preferredSetting", "thrivingFactors", "jobFrustationNotes", "referredBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: experiences; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.experiences (id, "candidateId", employer, role, "startDate", "endDate", "isCurrent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.projects (id, name, description, status, "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.tasks (id, title, description, status, "dueDate", "createdAt", "updatedAt", "projectId", "assignedToId") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.users (id, name, email, password, role, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: candidates_email_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX candidates_email_key ON public.candidates USING btree (email);


--
-- Name: candidates_email_name_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX candidates_email_name_idx ON public.candidates USING btree (email, name);


--
-- Name: candidates_email_userId_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX "candidates_email_userId_key" ON public.candidates USING btree (email, "userId");


--
-- Name: candidates_userId_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX "candidates_userId_key" ON public.candidates USING btree ("userId");


--
-- Name: experiences_candidateId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "experiences_candidateId_idx" ON public.experiences USING btree ("candidateId");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_email_role_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX users_email_role_key ON public.users USING btree (email, role);


--
-- Name: candidates candidates_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: experiences experiences_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT "experiences_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

