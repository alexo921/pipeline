--
-- PostgreSQL database dump
--

\restrict zWdoHhrftoCxuf75jJWi5vrGRHQCGQx1DwYYy8n2cV0kgwsycaKtwtFtORu3KuA

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pipeline_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO pipeline_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pipeline_admin
--

COMMENT ON SCHEMA public IS '';


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
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.analytics_events (
    id text NOT NULL,
    "eventType" text NOT NULL,
    "eventData" jsonb NOT NULL,
    "userId" text,
    "sessionId" text,
    "ipAddress" text,
    "userAgent" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.analytics_events OWNER TO pipeline_admin;

--
-- Name: applied_jobs; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.applied_jobs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobId" text NOT NULL,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.applied_jobs OWNER TO pipeline_admin;

--
-- Name: apply_clicks; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.apply_clicks (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "userId" text,
    "ipAddress" text,
    "userAgent" text,
    "clickedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.apply_clicks OWNER TO pipeline_admin;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.candidates (
    id text NOT NULL,
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL
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
-- Name: job_views; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.job_views (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "userId" text,
    "ipAddress" text,
    "userAgent" text,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_views OWNER TO pipeline_admin;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.jobs (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    location text,
    company text,
    salary text,
    requirements text,
    benefits text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "zipCode" text
);


ALTER TABLE public.jobs OWNER TO pipeline_admin;

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
-- Name: saved_jobs; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.saved_jobs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobId" text NOT NULL,
    "savedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.saved_jobs OWNER TO pipeline_admin;

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
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text,
    "ipAddress" text,
    "userAgent" text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone
);


ALTER TABLE public.user_sessions OWNER TO pipeline_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: pipeline_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'CANDIDATE'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "emailSubscribed" boolean DEFAULT true NOT NULL,
    "unsubscribedAt" timestamp(3) without time zone,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "googleId" text,
    "googlePicture" text
);


ALTER TABLE public.users OWNER TO pipeline_admin;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d4d822a2-aa6b-4151-bc75-13fe3ea58088	5920f64bfa0e00e9e9df159c68ab074d1f5f9c396b160eb2c4863a0a242ae125	2025-07-31 16:39:35.321085+00	20250622155241_init	\N	\N	2025-07-31 16:39:35.240977+00	1
a5305b50-b129-46cc-888c-3294ce872f44	1398d1ca59f2743d4215ebbd06fe6ee826aec104a7dcb763b97c31338e93a698	2025-07-31 16:39:35.337577+00	20250710215323_split_name_to_first_last	\N	\N	2025-07-31 16:39:35.324847+00	1
78e1c70f-5e2b-463d-94da-06cc418a2d61	370b8234787277b51dd3197838c6dcac2b5aa9a594ea4d45302305283288f54f	2025-07-31 16:39:35.384402+00	20250710220136_add_jobs_tables	\N	\N	2025-07-31 16:39:35.339154+00	1
6f62a28f-9a9b-487c-8be6-34f84e22c609	85c9f08358fc7f87e2acc5aac0c219a877bfa4e317a89d376c7d2d7cfe0ddc74	2025-07-31 16:39:35.396204+00	20250714182744_add_zipcode_to_jobs	\N	\N	2025-07-31 16:39:35.385972+00	1
ed33bb97-415d-4650-b8f7-b0f63062d157	cbeab642c718227f8d3962f4bf538f8c727bcb85d8325aed0f23375fd6f21164	2025-07-31 16:40:04.465135+00	20250731164004_add_analytics_tables	\N	\N	2025-07-31 16:40:04.405781+00	1
a89c2d98-cdc2-444e-8cbc-9b1524d66a93	10b9d5e3a594393d2b74a4f851aed80caf12638df63332c4b27a727518d3beb1	2025-08-01 17:20:49.005788+00	20250801172048_add_analytics_events	\N	\N	2025-08-01 17:20:48.962824+00	1
3eeeae5a-aa02-41f6-b38a-d6f3c30430c7	832d1a5bd267bc0193acd26b2f9430d8e3e805f9217ba4e9007ea1d719ad0946	2025-08-04 14:56:08.972392+00	20250804145532_add_google_oauth_fields	\N	\N	2025-08-04 14:56:08.931646+00	1
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.analytics_events (id, "eventType", "eventData", "userId", "sessionId", "ipAddress", "userAgent", "timestamp") FROM stdin;
96c9f0cd-9ae3-481d-875b-e1a0f128191f	test	{"test": true}	\N	\N	172.18.0.1	curl/8.5.0	2025-08-01 17:20:57.147
99bbe921-24f4-4b34-b14d-dedfb6d7c71d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:00:07.13
b01457cb-c22a-4810-9be6-94c5c06687ef	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:00:07.053
9ddd3ec5-d412-4e45-80f2-3c4b4b166bca	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:38:14.048
502b723d-ac79-4209-b380-fff53479f3f3	session	{"action": "start", "pagesVisited": 0}	\N	session_1754329341634_er05mhj8l	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 17:42:21.678
9955f571-f645-4b6a-bbc0-b24938389e83	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754329341634_er05mhj8l	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 17:42:21.636
55fcdfca-ceb9-4ba0-a267-b0c06b711a9b	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754329341634_er05mhj8l	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 17:42:27.936
a5ad6c8d-4591-4473-8a32-f5a800ac85f0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754329341634_er05mhj8l	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 17:42:27.941
e72e47b4-bbc9-472a-a824-429f7e0c827a	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:49:07.087
1c3e27a1-b201-44fb-91f9-0f90348ad7f8	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:49:06.97
438a7261-ef04-4297-9aba-3c63686a39a4	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 18:07:23.576
665784ea-e364-4b60-94e4-eccf9cf7a9b5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 18:07:23.694
c6e32e5e-b0d4-4fc6-967c-7781c3829c31	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 18:07:30.999
3af81fe7-d162-479c-bdd3-05561e0779b0	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 18:42:21.003
83a2ffd2-1e94-4d1e-94db-3eb8e1717096	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 18:42:21.128
324b72a7-2eb9-4f0a-bd5c-bd60a16e2507	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 18:42:22.585
ede87583-83a2-4dae-88dd-423bf06a3722	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 19:45:49.792
5b3f0600-89f8-434f-8ba0-79894c6d173c	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 19:45:49.651
adfe1c62-712e-40a0-8d81-61d7fa0ffff3	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 19:45:50.237
0fea51f6-6359-4493-90c0-4b196c7fdaaf	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 19:45:50.102
68073605-706c-4fad-bcef-b82255b383f9	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR6bbcwtThyOT27bJ2Pk-t6nA5WMDkmoudBdeFl02mUpzu0FvLDGvzg-jBg_dw_aem_1iQCx8TsfZu-WNb-GEDiqA"}	\N	session_1754336925680_waxf1b31w	172.18.0.1	Mozilla/5.0 (Linux; Android 10; NEN-LX1 Build/HUAWEINEN-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.105 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/468.0.0.8.112;FBCX/modulariab;]	2025-08-04 19:48:45.685
dced36a4-63d4-44bb-8885-51b262424a4a	session	{"action": "start", "pagesVisited": 0}	\N	session_1754336925680_waxf1b31w	172.18.0.1	Mozilla/5.0 (Linux; Android 10; NEN-LX1 Build/HUAWEINEN-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.105 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/468.0.0.8.112;FBCX/modulariab;]	2025-08-04 19:48:45.617
62554277-c237-4c20-9b69-51e12a755685	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754336925680_waxf1b31w	172.18.0.1	Mozilla/5.0 (Linux; Android 10; NEN-LX1 Build/HUAWEINEN-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.105 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/468.0.0.8.112;FBCX/modulariab;]	2025-08-04 19:48:47.567
52de0913-1cc1-4020-a8f1-d4fd859961cf	session	{"action": "start", "pagesVisited": 0}	\N	session_1754336925680_waxf1b31w	172.18.0.1	Mozilla/5.0 (Linux; Android 10; NEN-LX1 Build/HUAWEINEN-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.105 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/468.0.0.8.112;FBCX/modulariab;]	2025-08-04 19:48:47.667
b023d068-d333-479d-a2eb-74b2827987d0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:10.724
81bd9ca6-b9e6-454b-be75-b6edaa1a77f5	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:10.677
958049ee-4cc1-4a67-9352-9109c9ee4ba5	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:13.078
8e886ba6-5650-44ca-aeb2-93b667fee89d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:56.833
b9c7adf5-b8c1-4b12-a795-d098773fc163	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:56.772
d622c5be-b207-482a-b9a6-9214181a7857	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:58.748
3d7fd0aa-c62a-4c1c-90bc-9acb31babaf6	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 20:04:33.09
3e51c739-de8f-427c-9ab6-52a068f6bfa2	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 20:04:33.028
c80cba85-7720-44ea-9201-056021d3dff7	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 20:04:41.316
c76df488-678b-45d2-a59d-70a3ca8ae146	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 22:31:05.102
f0278b80-213f-42af-84a7-5b3e968459bc	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 22:31:05.229
a845f9ef-f7f2-4a85-985b-29b81c45173f	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754346707498_n9hs1pj44	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:47.498
4582f076-d281-4750-87e3-de6e6c897bc0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346707498_n9hs1pj44	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:47.585
3113ba43-619c-4e5d-8969-56676a1b773f	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346707498_n9hs1pj44	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:49.554
84d4b268-628d-4607-8ae4-6a51e705226c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346707498_n9hs1pj44	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:49.642
ef9ffff3-5888-4cf1-bf00-2a17da2e5a04	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754346742995_7gyotixku	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36	2025-08-04 22:32:22.998
355602a7-6ab4-44ca-9fc0-bbaf35559404	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346742995_7gyotixku	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36	2025-08-04 22:32:23.008
2517a15e-54c4-44e0-b98e-94d6e8e39cf2	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346742995_7gyotixku	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36	2025-08-04 22:32:23.656
447744a1-4252-404c-b94c-012e0fb08e74	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346742995_7gyotixku	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36	2025-08-04 22:32:23.641
24f17964-a174-461a-9149-7e6391431425	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346772478_5dw61vxjx	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0	2025-08-04 22:32:52.513
6ec785d3-1d42-49d6-8a16-53e15fb1953c	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754346772478_5dw61vxjx	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0	2025-08-04 22:32:52.504
59e122cf-c9b8-49b2-89d1-d92962eea935	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346772478_5dw61vxjx	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0	2025-08-04 22:32:53.44
6c2dd13c-2a95-451e-b590-46a0ef918c6e	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346772478_5dw61vxjx	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0	2025-08-04 22:32:53.414
aa91b2a7-41fa-4571-8d86-9547eae6f749	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-FNVleHRuA2FlbQIxMABicmlkETFXOGd4SmloeEZ2dVBSQkt6AR6gG9nJZrXJAKhRSYce0By3zebnxCqAkA02zqMpNwM7-40cSkellI-bOVw62Q_aem_9B98oad9I7CwG9wMmvb0vw"}	\N	session_1754346685379_8hrwyvr6o	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:25.38
fa272f82-fc3d-44ae-b25b-e8f2c3d9bae6	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346685379_8hrwyvr6o	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:34:47.873
b23c60a6-d8ee-4f34-8d8e-31a501bcc6e4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346685379_8hrwyvr6o	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:34:48.758
39d13c5c-729c-4b37-a2cc-d29de467c601	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346685379_8hrwyvr6o	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:26.085
56f5fa02-a7e2-4458-b7e5-5b1b87fef531	session	{"action": "start", "pagesVisited": 0}	\N	session_1754347213648_no9phlqo6	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	2025-08-04 22:40:13.745
3e992f36-405e-4d4b-b05d-ea4d41f6c6ef	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754347213648_no9phlqo6	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	2025-08-04 22:40:13.649
9a3412bf-b2f2-4de8-83de-19a627e28321	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-GL5leHRuA2FlbQIxMQABHtDkbmg-R016O-28eVEL_jffBDMiiuoHKprcvH3GvR_op7sk-tjocE2sexGj_aem_F8oiExVWQDdNey_FrmqS3w"}	\N	session_1754347887817_ijw72668c	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-04 22:51:27.82
1a6e5f3a-5f3e-4f9c-9ce3-afcc9c2bdfdf	session	{"action": "start", "pagesVisited": 0}	\N	session_1754347887817_ijw72668c	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-04 22:51:28.105
fb1f75cf-0ee7-4263-ae44-6cdf1016c5fb	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754347887817_ijw72668c	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-04 22:51:28.351
b3bdfeea-c128-4b5c-90ea-3d8c26f5fbf1	session	{"action": "start", "pagesVisited": 0}	\N	session_1754347887817_ijw72668c	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-04 22:51:28.663
25c291ee-b38f-479c-a797-b9ea9146562e	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-GVlleHRuA2FlbQIxMQABHrv_3LnYJbghmOW1LHH_02oFpW3pbOWiAU6UfXnfSYUpXg0OwM4eU4QVeuC1_aem_9OCp9G9bDkaJwsEzri8iwA"}	\N	session_1754348042697_gjv6hb9i9	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:54:02.698
76ba0ff5-d2f6-4bdc-add2-c18835121066	session	{"action": "start", "pagesVisited": 0}	\N	session_1754348042697_gjv6hb9i9	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:54:02.724
d90b969c-7c4b-46b6-82c0-51a0c38078ec	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754348042697_gjv6hb9i9	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:54:02.96
2382009d-0b83-48d8-b179-e5ae24a62f80	session	{"action": "start", "pagesVisited": 0}	\N	session_1754348042697_gjv6hb9i9	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:54:03.028
dd3ee937-35c7-40a1-84a9-f23fce88d762	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:04:03.859
491a43a4-63e0-4ec2-9866-c5120365a841	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:04:03.719
781da76c-c69c-46d9-a5f6-abfe31d1e77a	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:39:12.053
630cddd5-f5eb-4ce1-8c45-f005fc2cd137	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754348714973_il1p5czzr	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1	2025-08-04 23:05:15.053
b85c67e2-2281-45c7-a775-f368e4c119af	session	{"action": "start", "pagesVisited": 0}	\N	session_1754348714973_il1p5czzr	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1	2025-08-04 23:05:15.206
81064141-9c08-4b7b-80a1-57bc7bd75f7e	session	{"action": "start", "pagesVisited": 0}	\N	session_1754348746090_z0khqrriw	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 23:05:46.151
2b60e482-e65b-4b15-800c-db798b2ff85d	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR70JDuhBnvMeNnAtmDEF3559euWH-0DJ8zCrVQJpePLicfJFEeuRbO5xMnviA_aem_jqMtVkrn3rOPUNZw6fha6w"}	\N	session_1754348746090_z0khqrriw	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 23:05:46.091
5d971178-a0fb-4c15-a56a-9e551cc56413	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754348746090_z0khqrriw	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 23:05:46.78
587acc48-1a9c-41a9-99ab-d96ce1f78e1f	session	{"action": "start", "pagesVisited": 0}	\N	session_1754348746090_z0khqrriw	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 23:05:46.844
d1d9b6bc-62e8-42d5-9abb-e9a25ef8a943	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 23:12:01.501
387627a6-00b8-426e-9709-ad0f4ec85303	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 23:12:01.337
57129ae7-3a03-4d69-8f5e-eae3ef10e703	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 23:12:07.844
3d100bcc-6578-4d3f-8656-3209ff709eee	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:13:22.995
3204045a-6eac-4792-b635-a13dd4ebc084	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:13:22.845
aed59207-f807-4739-97f2-0edfdcd5ceff	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:25:13.642
b97a4bc0-4164-489e-bf90-806b6c7d8fde	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:25:13.509
6be4e3dc-5096-465f-b5f9-4fb10f67e2f5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:31:10.188
ec6028bb-b7cf-47ad-9652-d4d19f028699	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:31:10.03
12af2f84-5eac-45ec-a33b-5c4b984d4529	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754350381767_u1endb3uc	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-04 23:33:01.768
7f52ffe9-e8f2-4342-8d79-07619275e523	session	{"action": "start", "pagesVisited": 0}	\N	session_1754350381767_u1endb3uc	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-04 23:33:01.798
23ef7a65-f2b6-4fe9-816a-be946c6ea8ab	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754350381767_u1endb3uc	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-04 23:33:02.846
24944d67-4479-4050-8de8-2c40edc547de	session	{"action": "start", "pagesVisited": 0}	\N	session_1754350381767_u1endb3uc	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-04 23:33:03.072
600e3bbc-135a-4607-88a4-f9a294f1514d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754350427897_mgzkyqqdf	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-04 23:33:48.012
c78086da-71d2-4679-ae06-efd8909071fc	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754350427897_mgzkyqqdf	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-04 23:33:47.898
ef3e20b1-c6aa-4252-8c44-cff07818fe01	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754350427897_mgzkyqqdf	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-04 23:33:48.648
43236d17-ec7a-4cb8-ba14-f9611fa85789	session	{"action": "start", "pagesVisited": 0}	\N	session_1754350427897_mgzkyqqdf	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-04 23:33:48.668
2fe7b307-eea6-4163-95fd-431ddbb91500	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:39:11.92
4289f33f-fb03-4e0e-bc24-0279250151ed	session	{"action": "start", "pagesVisited": 0}	\N	session_1754350800524_z31cqra4n	172.18.0.1	Mozilla/5.0 (Linux; Android 14; Hisense U71 Pro Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-04 23:40:01.764
6fbd940f-1ac0-4cbf-a6fe-f7494d6d2ebd	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-JB1leHRuA2FlbQIxMQABHr4l1DErs5yVHH4i__4S-9GjDBnmSC8dLs_1s6x3hCtfngu77v5D-a09jPNa_aem_snbcA3kvhPVFrotZXg5Ffw"}	\N	session_1754350800524_z31cqra4n	172.18.0.1	Mozilla/5.0 (Linux; Android 14; Hisense U71 Pro Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-04 23:40:00.547
49384e6f-fe40-47f1-b6ae-92ac24e5dcf8	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754350800524_z31cqra4n	172.18.0.1	Mozilla/5.0 (Linux; Android 14; Hisense U71 Pro Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-04 23:40:02.723
d21fe6d4-0538-4458-a4ae-c043e19f95cc	session	{"action": "start", "pagesVisited": 0}	\N	session_1754350800524_z31cqra4n	172.18.0.1	Mozilla/5.0 (Linux; Android 14; Hisense U71 Pro Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-04 23:40:04.196
1e7f0673-a65c-489c-ae04-c92c44241bd4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:49:15.392
b0439ac3-3896-423d-a7ed-634211a78f69	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:49:15.36
d4e64cec-8eb2-4cfd-aa76-3bfeede71a69	session	{"action": "start", "pagesVisited": 0}	\N	session_1754353057464_pdhwjrgqj	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 00:17:37.502
2888fa97-1378-4472-8c3e-2dab7f2b8631	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754353057464_pdhwjrgqj	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 00:17:37.468
99eb6a75-a9d7-4a26-9cf2-9c4eb48fe2e5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754354518588_5hfwxfa1g	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0	2025-08-05 00:41:58.617
28e272fd-8067-4b56-8867-e0d24d8862c6	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754354518588_5hfwxfa1g	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0	2025-08-05 00:41:58.591
c824cea0-83dd-4fd2-91fb-193d4c2af2fd	session	{"action": "start", "pagesVisited": 0}	\N	session_1754354518588_5hfwxfa1g	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0	2025-08-05 00:41:59.358
9cd78e6c-5267-419b-bc11-a5b965072221	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754354518588_5hfwxfa1g	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0	2025-08-05 00:41:59.314
a06f3492-01c1-4229-a074-68d5c58d85b0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754358034124_edhv1emlb	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.92 Safari/537.36	2025-08-05 01:40:34.186
68c5c0d7-5a5e-4395-9544-8fdd740912ed	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754358034124_edhv1emlb	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.92 Safari/537.36	2025-08-05 01:40:34.136
80570d01-53af-4ca6-8a23-c208fd805be1	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754358034124_edhv1emlb	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.92 Safari/537.36	2025-08-05 01:40:34.903
a32f22ce-ab8e-4378-805d-11b90c8f68ab	session	{"action": "start", "pagesVisited": 0}	\N	session_1754358034124_edhv1emlb	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.92 Safari/537.36	2025-08-05 01:40:35.031
79518638-46f5-4bcd-a2eb-f1001804fa3a	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754358063908_058t3r44d	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.97 Safari/537.36	2025-08-05 01:41:03.937
38a4d74f-194f-4ea7-8ba9-90a155604801	session	{"action": "start", "pagesVisited": 0}	\N	session_1754358063908_058t3r44d	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.97 Safari/537.36	2025-08-05 01:41:03.993
655b33b8-f605-43fc-8196-8c3e093a9d55	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-dkxleHRuA2FlbQIxMQABHqkN3HaAfFEsQ-YcD8uagZLwYNSaZbNgGht3wwwI9yrj-VvOJv1NJqS1e1kF_aem_E7Tr8GxBcRCa8oF6MHclGQ"}	\N	session_1754371839883_o8ebb500h	172.18.0.1	Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.50 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/503.0.0.69.76;]	2025-08-05 05:30:39.892
66007c74-9149-463d-a1ed-eec4f9e1c3bd	session	{"action": "start", "pagesVisited": 0}	\N	session_1754371839883_o8ebb500h	172.18.0.1	Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.50 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/503.0.0.69.76;]	2025-08-05 05:30:40.425
0bb86ac9-dd01-489a-ac00-362aec91fec0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754388046201_9ytx2pvc9	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 10:00:50.138
a7385653-562c-4bb7-abcc-9552485e5e69	session	{"action": "start", "pagesVisited": 0}	\N	session_1754371839883_o8ebb500h	172.18.0.1	Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.50 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/503.0.0.69.76;]	2025-08-05 05:30:41.684
069e7f1c-3341-4c45-8edc-8fb4ba67aa69	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754371839883_o8ebb500h	172.18.0.1	Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.50 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/503.0.0.69.76;]	2025-08-05 05:30:40.919
7d80097d-996b-4fb2-aaa2-9d71610e75ba	session	{"action": "start", "pagesVisited": 0}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:16:31.861
79f2f8a5-4c8e-4353-bbfe-97b4ecacb3d1	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-gQBleHRuA2FlbQIxMQABHm6G7j8C6LObtIhyzaUcZRDSHtKAlnTkKZwXiQ2Z0bgrGnwLClIqBrZBcqXY_aem_m8yxrYcxNzxE6RSmVqMd-A"}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:16:31.054
24c00920-b844-43da-b893-785c846073c6	session	{"action": "start", "pagesVisited": 0}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:16:36.188
e6c7ad26-1065-42bd-9119-3e4777d2f9f9	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:16:34.658
ccabe91b-8005-4d53-bece-be60e8ccb6c4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:17:27.224
831d47a3-43ed-4e54-99a1-51a6de075425	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL-gT9leHRuA2FlbQIxMQABHm6G7j8C6LObtIhyzaUcZRDSHtKAlnTkKZwXiQ2Z0bgrGnwLClIqBrZBcqXY_aem_m8yxrYcxNzxE6RSmVqMd-A"}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:17:26.156
45cedebf-c7c6-4ad6-a23c-6ab5d32b5c1c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:17:31.567
e67d33cd-a0c0-40c0-a650-31d8049957be	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754374591040_b8h6t8uqd	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:17:30.769
de8e3d2a-bbf8-4719-845e-4c010ba3eb1e	session	{"action": "start", "pagesVisited": 0}	\N	session_1754374710976_i61ebfenf	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.179 Mobile Safari/537.36	2025-08-05 06:18:31.803
b7627afe-de6c-4743-a2ed-89a5a48430f8	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754374710976_i61ebfenf	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.179 Mobile Safari/537.36	2025-08-05 06:18:30.982
83188a0b-3bd3-47d9-a2dc-7176af8c4f27	session	{"action": "start", "pagesVisited": 0}	\N	session_1754374710976_i61ebfenf	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.179 Mobile Safari/537.36	2025-08-05 06:18:34.7
52975d14-0c79-47f6-81d2-f7b1549308dd	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754374710976_i61ebfenf	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.179 Mobile Safari/537.36	2025-08-05 06:18:33.476
ab95cc92-c222-4227-9fb2-31da37fac0fe	session	{"action": "start", "pagesVisited": 0}	\N	session_1754387249595_zdje0wx2q	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 09:47:37.205
0c8ec2b9-3996-4850-b875-92393681fd48	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754387249595_zdje0wx2q	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 09:47:29.595
25419782-29cc-40d2-9795-c661b4d20563	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 09:49:34.962
a52616b0-5d00-418c-b957-e5e257396111	session	{"action": "start", "pagesVisited": 0}	\N	session_1754346665100_q4w2gln28	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 09:49:34.982
5eda1d6e-21d6-461b-9b57-0f31fbcb73df	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754388046201_9ytx2pvc9	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 10:00:46.202
8218a3ba-8c50-488f-b75e-59b7c04d0559	session	{"action": "start", "pagesVisited": 0}	\N	session_1754388046201_9ytx2pvc9	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 10:00:46.229
d793b384-5df0-4aa0-960e-12b73729d5b7	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754388046201_9ytx2pvc9	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 10:00:50.11
d3cdb7a4-1850-4c3b-b3ac-1a696d2721e4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 10:56:05.28
76bfad3a-b19a-4509-881f-f658caee6282	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 10:56:05.431
5437652a-b452-4377-b0e7-a6699ae53b21	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 10:56:05.294
989f7e5a-4341-4b91-840e-daedb9d8d8ac	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 11:30:42.926
59cfbf5f-909c-4ddf-a42d-9b53014a89bd	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 11:30:42.794
70a70b3a-055f-44e5-9940-3a4bef26b45e	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 11:30:45.118
d1c35194-9c84-4aef-9fc4-c9a7fcc33d23	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR6R9URBV7unxB2Dq7oF59AXaI6BTk_TjuPW5wykTxjJyDQNYJsvUjL0wT494g_aem_4WCvgbTneP5xSaNZZmf35A"}	\N	session_1754396122391_23i5084vx	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A235F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/470.0.0.3.109;FBCX/modulariab;]	2025-08-05 12:15:22.399
07698714-f85e-4028-a1a8-1496fd497ef5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754396122391_23i5084vx	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A235F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/470.0.0.3.109;FBCX/modulariab;]	2025-08-05 12:15:30.733
96641706-8569-4adf-ad84-23e68051c936	session	{"action": "start", "pagesVisited": 0}	\N	session_1754396122391_23i5084vx	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A235F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/470.0.0.3.109;FBCX/modulariab;]	2025-08-05 12:15:32.45
40ab806e-085e-42a8-9596-a9e56c45cc81	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754396122391_23i5084vx	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A235F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/470.0.0.3.109;FBCX/modulariab;]	2025-08-05 12:15:23.912
92862343-cc69-4cce-9d91-33947870f930	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:50.316
77e078ef-e534-4a20-9e9e-1fd7befbdbad	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:50.46
06369d28-48a3-4229-a3bb-b3fd7c60898b	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:50.633
873a8f1a-e87d-48f6-82a7-f27f225e9bf3	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:50.556
d502a05c-01ad-45ab-99f0-4076d02839d6	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:54.691
2c395779-e517-40d3-8dbe-98d8198c43e5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:54.756
70c072c5-ee94-46b6-ab83-b672003477ca	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:54:01.743
8e740018-630d-478a-92dc-0893e6812776	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:22.975
ea86b39f-2a37-4957-835d-d537f757fcbe	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:23.126
6bf8788f-973e-412b-aded-d0058010e79c	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:23.256
284faaed-db4d-4f4e-8a10-9bfb7fedca47	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:23.485
da9436bf-e457-450a-83ec-42af698e6db4	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:30.965
caaa2bff-e233-4046-a767-cbcb4ab6b968	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:31.029
b6f931c6-02d4-48cb-955a-f34946235a08	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:39.158
6b2e3d4a-86b2-4fc1-86fb-52401b2b39f9	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR4iaY6HtkkYjuqApMJgY5-VjgGND-hvA5qc-EuDfgeiq5QGKh9rMOqlDJ3mzQ_aem_TdkGtyIoDSN2iy_LoKlvSg"}	\N	session_1754400737771_eo4ad302m	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A135F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/469.0.0.15.116;FBCX/modulariab;]	2025-08-05 13:32:17.782
c9a5ca18-9b7b-42dc-84ce-89eca6709c50	session	{"action": "start", "pagesVisited": 0}	\N	session_1754400737771_eo4ad302m	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A135F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/469.0.0.15.116;FBCX/modulariab;]	2025-08-05 13:32:17.699
22c35a4a-2fb2-4c31-8117-2bf38f3b72c3	session	{"action": "start", "pagesVisited": 0}	\N	session_1754400737771_eo4ad302m	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A135F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/469.0.0.15.116;FBCX/modulariab;]	2025-08-05 13:32:20.072
91eb166c-fc61-4ecf-b15c-918a7f3ac0b7	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754400737771_eo4ad302m	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A135F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/469.0.0.15.116;FBCX/modulariab;]	2025-08-05 13:32:20.036
ea87bec7-4a7c-4b08-9d44-f08dd890f31f	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:41:05.232
34632dcc-1652-4fea-8cf0-4357d5854900	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:41:05.198
5a8893f9-2d52-4fdc-a43b-71e53e58955d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:27.017
9bd7d3dc-4229-47ad-a41f-f28fbee38222	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:26.957
9a2e3c24-2ab2-486f-a27b-634bf17acb75	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:29.065
cd5b6f19-f644-48b4-9537-bd7edbbfe850	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:31.373
1a161b10-f98a-4fc7-a096-887fdac11399	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:31.425
441ca12c-e403-4029-84a6-5268668651c3	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:33.257
394a3f28-3610-405a-aba6-c5e1a915cdbd	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL--T1leHRuA2FlbQIxMQABHuJGvhhmuk3ozf3iWAdN41gEb-ZAhrTSb_MfAnAKbdw-K4hILakUN230PZfK_aem_V306aG4ByKrqfwNDnJmE_w"}	\N	session_1754405358552_h92l4euwt	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-G781V Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.176 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 14:49:18.557
3e31a72b-7445-4c46-aff2-21f05135f3a7	session	{"action": "start", "pagesVisited": 0}	\N	session_1754405358552_h92l4euwt	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-G781V Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.176 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 14:49:18.834
d8ff179f-8044-4890-b82d-d47015e283a5	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754405358552_h92l4euwt	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-G781V Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.176 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 14:49:18.897
5d951a0e-668f-48f9-b563-2df4a440469d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754405358552_h92l4euwt	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-G781V Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.176 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 14:49:19.257
36d5f078-0f52-476a-a202-d505c7e6d7dd	session	{"action": "start", "pagesVisited": 0}	\N	session_1754407271483_w622s1gsf	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-05 15:21:12.346
21045953-1074-4182-bef4-e9a91ad87777	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawL_ALVleHRuA2FlbQIxMABicmlkETFHTGZ1NkNrUUZydGl1MkJYAR7HpsKYXxp5bC-QhMLL0clnk00RAhslhknFui50sHe_WeoP3m8Huxmx3bZfsw_aem_3vyyjAtVaopMT9dedPKklA"}	\N	session_1754407271483_w622s1gsf	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-05 15:21:11.485
c05f62db-08c1-447b-968e-ab9495d7d9c7	session	{"action": "start", "pagesVisited": 0}	\N	session_1754407271483_w622s1gsf	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-05 15:21:13.389
b76c3d2f-3acd-4c78-83b1-6370ec175f2c	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754407271483_w622s1gsf	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-05 15:21:12.32
0ffdadd9-146c-46ed-a23e-89638fe419c5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:02.868
0a1babca-70ec-4a7a-88dd-33bbec4b0831	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:02.78
aa317060-9d60-4446-bc3c-6254f35bc044	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:03.115
a24512a1-6ea5-46c3-aaba-de8de9911373	session	{"action": "start", "pagesVisited": 0}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:03.301
27bc41ff-94fe-4a0f-b062-75d2881075c7	session	{"action": "start", "pagesVisited": 0}	\N	session_1754421748166_5cydqqg3s	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:28.242
5792ae6c-6d95-4edb-abe5-cb666d679606	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754421748166_5cydqqg3s	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:28.167
e900ad18-fd6f-4e6d-934b-1c5ce6f7c878	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754348714973_il1p5czzr	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1	2025-08-05 20:10:01.539
2167e906-c091-47c8-a4c3-e96511a9caf1	session	{"action": "start", "pagesVisited": 0}	\N	session_1754348714973_il1p5czzr	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1	2025-08-05 20:10:01.697
28d142a2-109e-4217-af07-d95444a1dfcf	session	{"action": "start", "pagesVisited": 0}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:43:39.481
4db77943-d52c-4bd6-8db3-be3cefef937d	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:43:39.456
be153075-f05f-4713-a6de-27c790e701dc	session	{"action": "start", "pagesVisited": 0}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:43:40.152
7d44303c-53a6-4d75-b514-ebd7694458a8	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:43:40.106
290fbd36-5eed-4cb9-863e-46426c7f9ae2	session	{"action": "start", "pagesVisited": 0}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:44:04.574
4d0094be-ac70-4719-9788-f53dc74745ca	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:44:04.54
9ffd0cdd-b406-4d3b-8755-758087a4e8fc	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:44:05.068
165b270c-5119-4a66-8697-2bb4d2931564	session	{"action": "start", "pagesVisited": 0}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:44:05.094
9c022211-1653-4408-a6f9-7ecb4c949faf	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:49:29.556
43e4562f-3a87-4965-8a98-50286571a94b	session	{"action": "start", "pagesVisited": 0}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:49:29.59
9d2b0cff-d64a-4381-9c3b-3cd7981a3392	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:49:30.068
3b1f9388-0605-40a3-92a4-7035f46defba	session	{"action": "start", "pagesVisited": 0}	\N	session_1754430219448_ayaqg9bj0	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:49:30.104
ae3a190a-c72c-45a5-a891-719837a3da0d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754431398366_nudftm2mc	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/518.0.0.36.107;FBBV/769778401;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.1.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]	2025-08-05 22:03:18.391
c46d48dc-e03c-4cc5-b4a8-838026db237b	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754431398366_nudftm2mc	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/518.0.0.36.107;FBBV/769778401;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.1.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]	2025-08-05 22:03:18.368
ab925930-c874-4ded-a666-e1116a5075ac	session	{"action": "start", "pagesVisited": 0}	\N	session_1754431398366_nudftm2mc	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/518.0.0.36.107;FBBV/769778401;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.1.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]	2025-08-05 22:03:18.646
6152e7cd-0f26-4cc5-a3ff-3ab86f3bb3d0	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754431398366_nudftm2mc	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/518.0.0.36.107;FBBV/769778401;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.1.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]	2025-08-05 22:03:18.617
a9be5bd8-208e-48ff-b30a-23b57fdeb6cb	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754482065037_nd64cdnrm	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-06 12:07:45.038
501b67da-f545-4217-b7f7-f5c9ca24deb0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754482065037_nd64cdnrm	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-06 12:07:44.564
36d16193-092f-41a1-8a97-4fc2544bd1df	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754482065037_nd64cdnrm	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-06 12:07:46.256
95812757-7557-4052-925d-7c8faf382ce6	session	{"action": "start", "pagesVisited": 0}	\N	session_1754482065037_nd64cdnrm	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-06 12:07:45.787
46741984-6b6d-4cf0-941b-5e79b461a4dd	session	{"action": "start", "pagesVisited": 0}	\N	session_1754484384152_xsz4xjn0m	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:46:24.183
6ea7f276-1518-49b4-ba48-e2873ff118a6	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://18.119.0.100/"}	\N	session_1754484384152_xsz4xjn0m	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:46:24.153
a8ae9fa4-4994-4a12-8b2f-c000007b2ea5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754484384152_xsz4xjn0m	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:46:25.986
3fcc7375-e806-4a3b-9b75-bc1a5f25e45d	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://18.119.0.100/jobs"}	\N	session_1754484384152_xsz4xjn0m	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:46:25.779
707be3db-70e1-4fc1-9ed2-6cc26f4c199a	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://18.119.0.100/"}	\N	session_1754484527256_avw8psr7k	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:48:47.257
669fd512-9cee-4d3e-8020-18285ae92089	session	{"action": "start", "pagesVisited": 0}	\N	session_1754484527256_avw8psr7k	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:48:47.287
ca059b28-7fbe-4315-96d3-c0ba6596811b	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://18.119.0.100/jobs"}	\N	session_1754484527256_avw8psr7k	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:48:48.535
92c67876-e5db-4ca3-aba1-01069c6e792c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754484527256_avw8psr7k	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:48:49.099
a0e966bf-1112-4971-8249-9f3ea1064456	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://18.119.0.100/"}	\N	session_1754484706294_oe4ebatfs	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-06 12:51:46.295
4f543529-bd5a-42f4-b262-eb655ae8cc99	session	{"action": "start", "pagesVisited": 0}	\N	session_1754484706294_oe4ebatfs	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-06 12:51:46.315
770d3e3e-c73c-429b-a19d-a65d65b81590	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://18.119.0.100/jobs"}	\N	session_1754484706294_oe4ebatfs	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-06 12:51:47.004
7e4db111-1da8-4c76-bb59-dabb163874d8	session	{"action": "start", "pagesVisited": 0}	\N	session_1754484706294_oe4ebatfs	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-06 12:51:47.115
baa11b22-e895-4cb4-beac-446f4854d2c9	page_view	{"pagePath": "/dashboard", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/dashboard"}	\N	session_1754504860042_dc3m1avj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-06 18:27:40.042
0cca2234-ba26-436f-9a9b-923b2c0bd9e7	session	{"action": "start", "pagesVisited": 0}	\N	session_1754504860042_dc3m1avj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-06 18:27:40.451
25897b0d-96cf-4140-be81-4056612d4590	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754569417275_vpovf6jgl	172.18.0.1	Mozilla/5.0 (compatible; HubSpot Crawler; +https://www.hubspot.com)	2025-08-07 12:23:37.276
cdeb7fdd-bc98-4e46-8565-adec50a699a5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754569417275_vpovf6jgl	172.18.0.1	Mozilla/5.0 (compatible; HubSpot Crawler; +https://www.hubspot.com)	2025-08-07 12:23:37.285
8386ddd8-7c43-4ee8-88db-2f6cd50cf27a	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754569417275_vpovf6jgl	172.18.0.1	Mozilla/5.0 (compatible; HubSpot Crawler; +https://www.hubspot.com)	2025-08-07 12:23:37.562
0eec92f8-b6f4-4602-a231-e8747b1ab175	session	{"action": "start", "pagesVisited": 0}	\N	session_1754569417275_vpovf6jgl	172.18.0.1	Mozilla/5.0 (compatible; HubSpot Crawler; +https://www.hubspot.com)	2025-08-07 12:23:37.569
c627081e-deb6-439e-b350-99aac21e377d	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754582451291_ylheqtrmy	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-A356E Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 16:00:51.297
15bd6aff-cf33-49e1-8cb1-fec5affc78b8	session	{"action": "start", "pagesVisited": 0}	\N	session_1754582451291_ylheqtrmy	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-A356E Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 16:00:50.816
21bae91a-b029-425d-861c-48d4f24aa72d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754582451291_ylheqtrmy	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-A356E Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 16:00:51.533
2d1ce083-8701-476c-8c42-33bd55bf993b	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754582451291_ylheqtrmy	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-A356E Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 16:00:51.994
41b69727-a67c-407e-9228-14ce0dedc8a7	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754593734441_vbwl7o21d	172.18.0.1	Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A.250705.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 19:08:54.445
95b0bc79-0766-43ec-8435-23b90827abd5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754593734441_vbwl7o21d	172.18.0.1	Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A.250705.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 19:08:53.523
32879e48-b1c8-4a09-ab76-b459db055967	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754593734441_vbwl7o21d	172.18.0.1	Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A.250705.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 19:08:54.834
d08b410c-bdaa-419b-825e-515b6a53faed	session	{"action": "start", "pagesVisited": 0}	\N	session_1754593734441_vbwl7o21d	172.18.0.1	Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A.250705.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 19:08:53.95
1dfc9553-7e50-4377-87d3-0c2baac312cf	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/"}	\N	session_1754625664346_atqe8s7ol	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36	2025-08-08 04:01:04.352
70698080-36fc-4676-880d-d02bc2aca314	session	{"action": "start", "pagesVisited": 0}	\N	session_1754625664346_atqe8s7ol	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36	2025-08-08 04:01:04.747
9e3a3c4e-3fcb-476e-86ee-14c195118c89	session	{"action": "start", "pagesVisited": 0}	\N	session_1754625664346_atqe8s7ol	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36	2025-08-08 04:01:06.481
b142ef5d-bfbd-49bc-af38-950ea4242c88	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/jobs"}	\N	session_1754625664346_atqe8s7ol	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36	2025-08-08 04:01:06.351
6634d4de-26de-4b18-aabb-d470368c48e7	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-08 20:46:18.012
e1476e32-3eec-482b-ad57-c00c3e201690	session	{"action": "start", "pagesVisited": 0}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-08 20:46:18.08
eec130d7-c335-434d-afd0-8dd30130159e	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754332941000_ctwkl2hmp	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-08 20:46:19.376
f8a5c4f3-5fd7-42b8-92d2-c505cce074a7	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR71iXOI-qzE5-Z_-qphi3ZWgi2eZ7URj3KUSFQYKIOd55lxD6Q6hxvWKxyWxg_aem_1XTkzDrW0EV-6fEjWWb7hA"}	\N	session_1754752862519_a8puqx5bs	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.1.0.47.100;FBBV/771349287;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/774983782;IABMV/1]	2025-08-09 15:21:02.523
f4976849-388e-44c5-916f-253f770f1e7c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754752862519_a8puqx5bs	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.1.0.47.100;FBBV/771349287;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/774983782;IABMV/1]	2025-08-09 15:21:02.585
a3448df2-2765-4960-91f1-26763bd2e722	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754752862519_a8puqx5bs	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.1.0.47.100;FBBV/771349287;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/774983782;IABMV/1]	2025-08-09 15:21:03.232
da5d32c9-2c3f-4a6d-91c8-d629d8f522ba	session	{"action": "start", "pagesVisited": 0}	\N	session_1754752862519_a8puqx5bs	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.1.0.47.100;FBBV/771349287;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/774983782;IABMV/1]	2025-08-09 15:21:03.295
a867358e-be7a-4ea8-a487-7f6d7a989810	session	{"action": "start", "pagesVisited": 0}	\N	session_1754504860042_dc3m1avj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 19:42:58.968
97b8fe56-d9a0-4cd3-97d7-76e5d707415d	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754504860042_dc3m1avj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 19:42:58.525
d5279896-37c1-4a80-ac0f-ee7d7f530e84	session	{"action": "start", "pagesVisited": 0}	\N	session_1754504860042_dc3m1avj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 19:43:01.525
4ffe5cdc-002c-4615-8ea2-068967313bad	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754504860042_dc3m1avj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 19:43:01.476
5b0b8af7-536b-4f0a-81cf-af6ceec2b3f7	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:14:49.495
96fb3c7a-3cee-431a-bfea-656d761d5908	session	{"action": "start", "pagesVisited": 0}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:14:49.506
1fdd4a59-92b1-42e2-a274-42974d88d0e8	session	{"action": "start", "pagesVisited": 0}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:14:49.848
241a465c-e750-4441-b877-cce9a9f23e55	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:14:49.845
b860cb21-5fc8-4085-8ff4-8e72891cd57c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:45.891
6440a7f1-cfb9-4fc2-b6d0-835e61008fc1	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:45.89
407e7d5a-4d71-4f77-b8c0-365a28ff73d1	session	{"action": "start", "pagesVisited": 0}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:46.162
733efd66-d72c-4b4e-b362-abefee0b20ce	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:46.16
7a2514f5-86f7-4c12-a82b-1aa0f931c21e	page_view	{"pagePath": "/jobs/robots.txt", "pageTitle": "404: This page could not be found.", "pageLocation": "https://pipelineworkforce.com/jobs/robots.txt"}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:55.042
dbc30e10-3d6d-4348-964b-df88ab07f882	session	{"action": "start", "pagesVisited": 0}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:55.05
9972ec18-e334-4a59-a1c7-ed2c7d327744	page_view	{"pagePath": "/jobs/robots.txt", "pageTitle": "404: This page could not be found.", "pageLocation": "https://pipelineworkforce.com/jobs/robots.txt"}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:18:39.713
4eb20759-4452-4778-86fd-a97727c5bed5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754806489493_655ppklj8	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:18:39.716
0cf440be-ff8b-43bb-9624-11f2962d91f0	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754808585240_43ixjr33r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.5 Safari/537.36	2025-08-10 06:49:45.242
a04d5bde-0937-4022-8db9-4cdee6a91fc7	session	{"action": "start", "pagesVisited": 0}	\N	session_1754808585240_43ixjr33r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.5 Safari/537.36	2025-08-10 06:49:45.445
81810d21-e89f-43cc-805d-de3db95e9e66	session	{"action": "start", "pagesVisited": 0}	\N	session_1754808585240_43ixjr33r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.5 Safari/537.36	2025-08-10 06:49:49.537
18055c1a-db5b-45d9-b567-8a06f33102bb	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754808585240_43ixjr33r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.5 Safari/537.36	2025-08-10 06:49:49.43
21f07705-3308-4764-a522-1761e6a1f868	session	{"action": "start", "pagesVisited": 0}	\N	session_1754878152384_dpqwomwg7	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:12.595
98c786d9-34c6-4129-b0ad-0a5b02a706d5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754878152384_dpqwomwg7	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:13.834
57596bcb-615a-435b-9967-e940dd8db0f7	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/jobs"}	\N	session_1754878152384_dpqwomwg7	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:13.618
6038a038-d855-429f-b1f9-5d64b0e61425	session	{"action": "start", "pagesVisited": 0}	\N	session_1754878152384_dpqwomwg7	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:21.758
ecdf9ebd-3dfd-4aa8-88cf-037c6190b4ff	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/jobs"}	\N	session_1754878152384_dpqwomwg7	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:21.508
ecfb921c-c02e-4f8d-bfb7-a73d46ed4bf7	session	{"action": "start", "pagesVisited": 0}	\N	session_1754901872946_mcy5j313p	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-11 08:44:33.107
0c6f7c00-a2b1-4bd8-a773-34f6e695386e	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754901872946_mcy5j313p	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-11 08:44:32.949
8452a0a3-6465-4325-9a53-de4df1ba07fb	session	{"action": "start", "pagesVisited": 0}	\N	session_1754901872946_mcy5j313p	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-11 08:44:35.717
36ac288b-5916-4b78-b63b-e21f076ff5ad	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754901872946_mcy5j313p	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-11 08:44:35.559
d197e152-48f8-449f-8659-1cf7a16f2568	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754903275494_4uah5476j	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:07:55.495
612ed31f-5da6-43ab-8ea3-2f66843516e4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754903275494_4uah5476j	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:07:58.237
388db608-3a2d-4866-8523-4ce4e794b7e7	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754903275494_4uah5476j	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:07:58.457
4bbf6208-c923-48ff-8f72-93d12773f313	session	{"action": "start", "pagesVisited": 0}	\N	session_1754903275494_4uah5476j	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:07:59.197
49669e61-6973-4eef-9685-a80d602a28b2	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754903300932_6ajaau9hg	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:08:20.934
7cfa40ac-3beb-45ef-9673-ab82212bd9f0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754903300932_6ajaau9hg	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:08:22.585
d1283630-9f9d-4161-b058-f36f15e58f2e	session	{"action": "start", "pagesVisited": 0}	\N	session_1754917316596_n6cbkxsm7	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/525.0.0.53.107;FBBV/774177433;FBDV/iPhone14,7;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/776162600;IABMV/1]	2025-08-11 13:01:56.637
3ecc29a1-0d63-4347-b045-36f9e5ad2166	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR7KjdF-vBMJupEJmGImsdBmoy9olIilRK_w95PTTc2K-VLcwBoXoY1Ges6fSw_aem_1ToERo9kpAt5JtWHCfevzA"}	\N	session_1754917316596_n6cbkxsm7	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/525.0.0.53.107;FBBV/774177433;FBDV/iPhone14,7;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/776162600;IABMV/1]	2025-08-11 13:01:56.598
01d39788-6093-4089-bb78-7152da597c60	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754917316596_n6cbkxsm7	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/525.0.0.53.107;FBBV/774177433;FBDV/iPhone14,7;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/776162600;IABMV/1]	2025-08-11 13:01:57.056
ed0e6ee8-6f08-437b-a1ba-bd098b3ff864	session	{"action": "start", "pagesVisited": 0}	\N	session_1754917316596_n6cbkxsm7	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/525.0.0.53.107;FBBV/774177433;FBDV/iPhone14,7;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/776162600;IABMV/1]	2025-08-11 13:01:57.091
e15a7153-653d-44f3-9a42-3c2e0a8fbf44	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755036068203_378ep39fy	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-08-12 22:01:08.205
061d0d30-c127-416f-a84b-cd49659be0f7	session	{"action": "start", "pagesVisited": 0}	\N	session_1755036068203_378ep39fy	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-08-12 22:01:08.313
6cf53948-f182-4a72-bcc1-21e1712cbd15	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755036068203_378ep39fy	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-08-12 22:01:08.673
d160b865-794b-4eac-a499-fd1a8e1338cc	session	{"action": "start", "pagesVisited": 0}	\N	session_1755036068203_378ep39fy	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-08-12 22:01:08.788
fe1c0cf9-7917-4b5d-9dff-88afb20bc76b	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 22:52:57.106
cff72b23-dcc6-4a57-8363-5e1484ebcaa2	session	{"action": "start", "pagesVisited": 0}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 22:52:57.235
1c173cb4-2f3f-456f-95bf-3301c72c8d1a	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 22:52:57.444
28926b92-638f-4cf8-b19f-77285b691402	session	{"action": "start", "pagesVisited": 0}	\N	session_1754421722779_dnb2uetid	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 22:52:57.568
9d93e6c1-1da3-482b-8ec4-c9df2ac1c6c5	session	{"action": "start", "pagesVisited": 0}	\N	session_1755107355771_7kk0azjpv	172.18.0.1	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 17:49:16.841
3cce3738-9b0c-411f-8966-a0fac6da4dcb	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawMJr2hleHRuA2FlbQIxMQABHk-insvlPLgyUMAAmnex0gjnH7Jd9ls5b6xasqQdr_4g9CFrImyaY8CyDorn_aem_dExVaFBPBMUscZOVJeutHg"}	\N	session_1755107355771_7kk0azjpv	172.18.0.1	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 17:49:15.859
19d279ae-6d87-4e1c-b1a6-ee541af08975	session	{"action": "start", "pagesVisited": 0}	\N	session_1755107355771_7kk0azjpv	172.18.0.1	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 17:49:20.412
fed4415d-4de5-4eee-a0bc-89e15163711d	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755107355771_7kk0azjpv	172.18.0.1	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 17:49:19.392
e2cd5614-7bf0-4abf-994e-e567065b0ca1	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755115093619_nksenh15r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 19:58:13.619
dba654ef-9e18-49ca-b49f-faaab22b6a2e	session	{"action": "start", "pagesVisited": 0}	\N	session_1755115093619_nksenh15r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 19:58:13.662
2838dcdb-3ba6-4ede-888a-a2e10d2c2bf9	session	{"action": "start", "pagesVisited": 0}	\N	session_1755115093619_nksenh15r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 19:58:14.87
16259b5d-faab-48e2-bb04-32bb85db7d73	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755115093619_nksenh15r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 19:58:14.62
84983b7b-f664-42c4-bd30-088697b03c83	session	{"action": "start", "pagesVisited": 0}	\N	session_1755115093619_nksenh15r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 21:21:24.102
52ce647a-4a0f-4293-af05-b3632739c15d	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755115093619_nksenh15r	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 21:21:24.089
6e5ff1d0-0fc3-443b-8e29-f3d255ebfaff	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/"}	\N	session_1755199731339_8gh7z0a3b	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36	2025-08-14 19:28:51.341
d5b7e090-b698-4198-81ab-52eb0bdcf894	session	{"action": "start", "pagesVisited": 0}	\N	session_1755199731339_8gh7z0a3b	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36	2025-08-14 19:28:51.454
25d45234-82c8-4af6-b301-ef7c78a4a384	session	{"action": "start", "pagesVisited": 0}	\N	session_1755199731339_8gh7z0a3b	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36	2025-08-14 19:29:19.218
b6cac138-dd3d-41b3-a352-b7234da07553	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/jobs"}	\N	session_1755199731339_8gh7z0a3b	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36	2025-08-14 19:29:17.559
f1e1dcbc-293c-483b-bc7c-14345ae43e1d	session	{"action": "start", "pagesVisited": 0}	\N	session_1755202527896_7kfpzgcnc	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-S938U1 Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.75 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/525.0.0.53.51;IABMV/1;]	2025-08-14 20:15:28.115
60f6f83d-71c0-46b2-82f5-f5108e935a9c	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwY2xjawMLIy9leHRuA2FlbQIxMQABHvPWIHlC3KqQtn2MIshnhXvv-TjPl9m2hpmTnsra8mH8xotwISMKXrHE-BYd_aem_DV0cIReWvoa6qS4syXdJIA"}	\N	session_1755202527896_7kfpzgcnc	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-S938U1 Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.75 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/525.0.0.53.51;IABMV/1;]	2025-08-14 20:15:27.9
3b80141a-1c19-4399-ac46-e6d7c1a532f5	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755202527896_7kfpzgcnc	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-S938U1 Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.75 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/525.0.0.53.51;IABMV/1;]	2025-08-14 20:15:28.221
3d0e08a3-b782-42c0-9482-281be912ce4d	session	{"action": "start", "pagesVisited": 0}	\N	session_1755202527896_7kfpzgcnc	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-S938U1 Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.75 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/525.0.0.53.51;IABMV/1;]	2025-08-14 20:15:28.52
e2127ec5-b343-4941-9c17-d22595959d56	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/?fbclid=IwZXh0bgNhZW0CMTEAAR51LAKo5I_Y1oB4aCjyPZuXNiZ6B2RDJlWzHXUU7cs2-C__crcdOGDpXMypuw_aem_RLnTWRxa9gvdgueUOYKKeg"}	\N	session_1755353075338_4x4rfz82i	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-16 14:04:35.339
a7205bbb-3f28-45a0-b4e5-0f8916089464	session	{"action": "start", "pagesVisited": 0}	\N	session_1755353075338_4x4rfz82i	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-16 14:04:35.364
1fb260ce-5e2d-48dc-b91e-a0e227cfefc9	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755353075338_4x4rfz82i	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-16 14:04:35.891
16333264-d61e-461b-b550-69b605dbd55e	session	{"action": "start", "pagesVisited": 0}	\N	session_1755353075338_4x4rfz82i	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-16 14:04:35.917
b23329ee-104d-420d-9248-bc5a03ce30dd	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755511179857_1vestn5hp	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 09:59:39.857
f8995148-8240-4d44-9fa1-f82dff6af121	session	{"action": "start", "pagesVisited": 0}	\N	session_1755511179857_1vestn5hp	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 10:03:56.407
9ae14570-9a3c-45dc-a9a0-e261620ef5b3	session	{"action": "start", "pagesVisited": 0}	\N	session_1755511179857_1vestn5hp	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 10:03:58.176
1b0b1929-be6c-4802-8588-2aa36953f584	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755511179857_1vestn5hp	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 09:59:41.24
1a6ce4ca-8fbb-4775-a0af-e98c20e217be	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:17:48.175
312e61a4-ce99-441a-b19f-ed2d884f46fe	session	{"action": "start", "pagesVisited": 0}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:17:48.278
591fb6c7-57d6-431a-ac4d-0083644836bf	session	{"action": "start", "pagesVisited": 0}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:17:50.18
a9b1d535-08e6-413a-96fe-246b7de7492a	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:17:50.09
61335a1b-d697-4946-b908-01c8693d2759	session	{"action": "start", "pagesVisited": 0}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:19:57.279
6d084aa7-c7ae-4656-bb0d-381028bae09d	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:19:56.666
695d643c-a1c7-4cb6-810d-2284d0b273f7	session	{"action": "start", "pagesVisited": 0}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:19:57.672
4b350e1b-72b1-4373-afe7-4468eaccbdb1	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:19:57.584
0b1f5760-735d-4507-88cb-f5415796edf3	session	{"action": "start", "pagesVisited": 0}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 16:48:28.425
025d240d-90e0-408e-842a-c9e0a1204f2a	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 16:48:28.976
b26fc855-849c-4900-abff-f0c2ae594f6e	session	{"action": "start", "pagesVisited": 0}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 16:48:29.117
7988c190-3e0c-4283-9601-1064f48f84d1	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755523068175_hctgewcir	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 16:48:29.663
1d4cb330-7469-4e13-88f1-f1bc87966b8c	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755539907362_pvo3s4j6t	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36	2025-08-18 17:58:27.366
e625b5a1-2e6c-4b67-bdaa-8e1ea8c9ce67	session	{"action": "start", "pagesVisited": 0}	\N	session_1755539907362_pvo3s4j6t	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36	2025-08-18 17:58:27.39
5907f6b6-ba5c-40da-85cd-cf6c5932eafd	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755539907362_pvo3s4j6t	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36	2025-08-18 17:58:28.473
9d2141d9-bd80-434e-a135-b81750c65677	session	{"action": "start", "pagesVisited": 0}	\N	session_1755539907362_pvo3s4j6t	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36	2025-08-18 17:58:28.498
ff1c8588-07fd-4632-b49f-e4581364a4a6	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755542239469_fq4dsyvmn	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 18:37:19.473
9b71e3d7-043a-42f0-ac7d-e8178bc717e5	session	{"action": "start", "pagesVisited": 0}	\N	session_1755542239469_fq4dsyvmn	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 18:37:26.631
92816644-f5c3-4433-8905-77f98b4726dd	session	{"action": "start", "pagesVisited": 0}	\N	session_1755542239469_fq4dsyvmn	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 18:37:27.804
f256146c-7a97-483f-aac3-457aa4347b33	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755542239469_fq4dsyvmn	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 18:37:20.53
3929742e-a0df-4da4-a518-90513bb6520c	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755551424107_6hzsgkxy6	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 21:10:24.108
4c08eeff-d13d-4049-a379-e733621ec803	session	{"action": "start", "pagesVisited": 0}	\N	session_1755551424107_6hzsgkxy6	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 21:10:23.977
b0560b51-e72f-4779-8db9-b2e4ba6489f6	session	{"action": "start", "pagesVisited": 0}	\N	session_1755551424107_6hzsgkxy6	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 21:10:25.707
c65c6fbb-cc95-4fed-8db4-7bc00cd7108a	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755551424107_6hzsgkxy6	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 21:10:25.518
d34caa02-f28e-4915-aef1-606c6939a57a	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755560519507_zmx9e82c0	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 23:41:59.508
46e55083-03cb-4f2f-8245-6ef9679a7380	session	{"action": "start", "pagesVisited": 0}	\N	session_1755560519507_zmx9e82c0	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 23:41:59.925
437452e7-45eb-4b93-8e46-27dbce7f5a0f	session	{"action": "start", "pagesVisited": 0}	\N	session_1755560519507_zmx9e82c0	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 23:42:02.407
3299b59c-a1c6-4b1e-8f97-7fff672f6476	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755560519507_zmx9e82c0	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 23:42:01.68
e0ea337d-0838-4d66-9033-e9c21011eb4a	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755597385306_wx3jycerd	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 09:56:25.307
81b4ea16-5d0f-46ba-aba5-c8d1486bf103	session	{"action": "start", "pagesVisited": 0}	\N	session_1755597385306_wx3jycerd	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 09:56:24.649
996078d1-f206-427d-92b6-94c78621efd2	session	{"action": "start", "pagesVisited": 0}	\N	session_1755597385306_wx3jycerd	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 09:56:25.618
4cd80abe-d536-4e46-bb4a-c579620e21c7	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755597385306_wx3jycerd	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 09:56:26.045
131ab87a-f206-4afe-879e-eb3f53bd5520	session	{"action": "start", "pagesVisited": 0}	\N	session_1755611543650_yd2sk4zj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 13:52:18.25
666e6c63-e906-46bf-a258-34c60b744dfb	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755611543650_yd2sk4zj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 13:52:23.653
b05436a7-84cb-48f9-a6fc-fd02be661839	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755611543650_yd2sk4zj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 13:52:24.899
02985fe7-ca4d-4235-8a04-08b36c160408	session	{"action": "start", "pagesVisited": 0}	\N	session_1755611543650_yd2sk4zj1	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 13:52:19.679
2d06476a-e513-4bac-a15b-1175a658cdfa	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1755635566290_m0id2ir16	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-19 20:32:46.291
7e0ef148-bf4a-4c85-acb3-8edef49733db	session	{"action": "start", "pagesVisited": 0}	\N	session_1755635566290_m0id2ir16	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-19 20:32:45.391
d36c6b5d-f151-4fbf-9204-2774d7379906	session	{"action": "start", "pagesVisited": 0}	\N	session_1755635566290_m0id2ir16	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-19 20:32:45.797
285bc155-a753-40f6-8db6-abc8b56dd5f6	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755635566290_m0id2ir16	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-19 20:32:46.686
6615454c-65c2-4acb-b844-1cb3bf9a9b33	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/"}	\N	session_1755637356053_7nk7v2nqy	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-19 21:02:36.055
10f2fe66-c847-4c56-a998-885f4218114e	session	{"action": "start", "pagesVisited": 0}	\N	session_1755637356053_7nk7v2nqy	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-19 21:02:36.178
1d84ed81-4f03-4006-81f5-feb11134cadb	session	{"action": "start", "pagesVisited": 0}	\N	session_1755637356053_7nk7v2nqy	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-19 21:02:38.163
39e07d56-269b-4dba-835f-1a6dded3c992	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/jobs"}	\N	session_1755637356053_7nk7v2nqy	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-19 21:02:37.77
e0c7a860-b9ec-46e2-bd0f-315c878dd609	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/"}	\N	session_1755696527235_l0ms7qaru	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/375.1.776343893 Mobile/15E148 Safari/604.1	2025-08-20 13:28:47.235
47328199-e749-4fd2-b92c-d99697d83220	session	{"action": "start", "pagesVisited": 0}	\N	session_1755696527235_l0ms7qaru	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/375.1.776343893 Mobile/15E148 Safari/604.1	2025-08-20 13:28:47.286
fc517383-56e7-410e-87f1-faa108fc4002	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://www.pipelineworkforce.com/jobs"}	\N	session_1755696527235_l0ms7qaru	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/375.1.776343893 Mobile/15E148 Safari/604.1	2025-08-20 13:28:47.527
918b006d-110a-4faa-9708-2427e5d03c17	session	{"action": "start", "pagesVisited": 0}	\N	session_1755696527235_l0ms7qaru	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/375.1.776343893 Mobile/15E148 Safari/604.1	2025-08-20 13:28:47.566
50640916-5566-4630-9733-d00cedcf59c9	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:24.12
2da2b863-abd6-4f96-9e28-4f26acd80478	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:24.021
1147a49a-2f51-4ddf-b248-af488b261d6f	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:24.252
5c254e95-4abf-48dc-b13b-586c20ac5f95	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:24.381
5eac950c-b7b2-4cfb-95d6-09c3b82435cc	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:34.528
ce0a0b75-fa76-433a-a04b-fe5c82bf77b2	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:46.379
50805528-efeb-467e-ada9-019707554b16	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:46.451
4a3ded8a-12ac-46a8-bd53-3574f8285a13	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:54.517
8804a1e1-e7ef-48b3-815d-9abe06122755	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:54.589
5441c2bf-7250-433d-8eb3-27794369e1de	page_view	{"pagePath": "/your-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/your-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:54:03.163
35ab8bf1-f191-47c4-a39e-e3884cd13ab5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:54:03.235
63802dbb-c464-45d9-b17a-b0816e9ccef5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:35.731
9e149789-3bea-4598-b2a5-7d2f6350299f	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:35.63
0eeea156-c37d-44f2-be60-abea2d14a824	page_view	{"pagePath": "/analytics", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/analytics"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:40.232
e873f553-9ac7-48fd-b22c-fe41e0331d4a	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:40.307
73e309f7-a1af-47f9-aea0-6ec473e4f5de	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:51.742
12aff183-eea9-4c29-b35a-6a0c4c887fbb	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:51.815
10739367-a305-4594-994a-9103f93135a0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:06:35.402
462b035c-f2a6-466d-b906-6de58d71b375	page_view	{"pagePath": "/your-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/your-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:06:35.336
d0828157-98a3-48d6-a93a-af8ac033be59	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:13:15.927
94f0f48e-ac9c-4e81-9346-92a564769d36	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:13:15.859
92195ef7-c718-41b5-bc42-80a8e01f5639	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:25.166
9d739268-e4bc-499f-93b0-05e702b0c568	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:25.092
faa055fb-df44-4106-9704-4ef724de90ad	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:31.614
3c68c78c-1b38-4e68-b27c-a1a593b9c2ff	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:38.653
f0be125e-1533-4276-ad27-38a46d2b8d0f	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:22:22.769
c4a3e5b7-cef9-40c5-9703-2cd3c40564f6	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:31.549
222e2d9e-b46c-49e0-bd0c-a31b5711812d	page_view	{"pagePath": "/your-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/your-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:38.584
e7769f12-778e-4ecc-96f8-4f17dd863761	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:22:22.836
c12ae080-7b6c-44d4-a682-8cc964803437	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:28.263
23324900-6db3-4fa6-8b4a-6cea063ff559	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:28.35
ab88ed52-62bf-46de-8c54-a72788d6fa78	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:37.007
ddd279c6-e6d4-4ae9-bc83-b520ea14d7b3	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:37.058
47b87a19-a7bc-45e2-b308-62f2dd3e51a8	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:48.194
1ea5a720-78e9-4805-a639-b297b0ce2660	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:57.531
937cceef-51c6-4bb9-a766-4556c3ebee5f	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:57.58
3bcae8e4-db2b-4744-a8de-1a3c65bf5193	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:41:19.657
d8f5d51a-0378-4b54-82f5-6f40cf2503ed	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:41:19.71
5864f180-dc0e-4adf-8a8e-227e3adcea86	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:55:44.528
0ea8b148-d92b-4de3-9b2e-5e7dfaad806f	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:55:44.47
a490a870-0f59-4fde-a61e-937e4f94913e	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:56:25.391
d581f91f-e742-4f6b-9079-3e045f1fd53d	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:56:25.328
f419e889-c4be-486d-ac20-ed2bd1e04df7	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 21:49:39.904
f0bd21fc-d30b-4390-b64c-da27aa159bb9	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 21:49:40.004
98e47c0d-3bc2-4220-ae94-0a897027f2c0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:44.397
ead31bd9-dfc0-420f-bb0a-f18f8c804235	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:44.351
6cf44def-39ba-4278-b7db-80587c6b0960	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:45.417
a4e9d07e-bcc7-4355-a175-09b21cc57d1b	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:45.364
c214ea9c-2c1e-4445-bbe3-6e834e358deb	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:56.109
897b13da-b050-4618-8be3-1b37052a8591	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:56.158
8794d948-ddc5-4415-a272-dbcb069baf17	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:02.737
ba4a5346-eafd-47cf-b3c9-00835baa0b9d	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:02.689
84f75b3e-7af3-40ae-97da-ed150d1032be	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:06.197
b28e5463-996b-4d15-91ca-b9d23397c680	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:12.482
9d9510c4-173a-4a3b-b12a-9a60dcd52b73	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:23.551
4d92d239-8327-45ed-bd4c-6231ec8ad8f4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:27.964
a3a7a016-b52a-4522-8aaf-4f418087e098	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:27.921
98b9264e-99bc-4d40-b924-e21cdad268b4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:34.12
3c8a1602-b241-44e9-8fb2-321777fa241e	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:43.47
59b5031e-dcd4-4921-b6cd-5790b871c481	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:06.246
acc3e02a-8319-43e7-9caf-05a7d7763964	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:12.53
c65eb4c8-c050-4bc3-a026-242779edb910	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:23.501
38d5a16a-e7ba-42d3-a65c-1b710df30cf0	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:34.077
71d0348b-1616-488f-8c51-66af805a0107	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:43.519
b058e5d9-5b36-4f38-bd6f-b2c1601fd3d2	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:46:07.769
13a2dfe9-d866-4ce8-92af-594d1d806045	page_view	{"pagePath": "/", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:46:07.683
0c4b5eef-6f90-46aa-aa9d-e02983aa6a06	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:46:14.605
23cd1ca6-ce7f-4b46-98c8-5fa7f6be0ac9	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:46:14.687
1c63c6f0-8d0c-497d-a5be-bc1cefa8a68f	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:35.644
cc4d330f-7e85-49b3-8c01-e8d992536936	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:35.557
c42b891e-17b2-4c7e-8818-ac0a805c23b2	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:36.524
d7367ba9-2800-411f-b6d8-cf18eb70ac8e	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:36.446
cfa60864-8b5c-4b21-9e4d-83505ecb5f89	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:36.994
ecd3448b-bea8-4fe8-83b0-0f5475ed994d	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:36.882
d90a86ca-ebae-4643-ad1f-9c7e45fc5b71	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:37.952
75e6e2ba-4733-47f7-9c67-cc211fd7735c	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:37.874
6ac8fc52-477a-489d-963f-1b738102dbe2	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:48.82
5a250298-90d0-4763-9aa5-ef806470e9cf	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:48.905
30a4b3c1-7eb5-4321-b75e-e38ddbc3aa99	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:01:47.852
e56fd298-dee5-4a69-b64a-c39be17b598c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:01:47.963
58d73e1e-7a1e-418e-b41b-4150dd462818	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:01:52.517
81973d58-f65a-4b3b-9695-39071a404802	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:01:52.6
bf584268-265f-4794-a026-69ca85b3ad3a	user_login	{"method": "email", "source": "job_board", "userId": "480c9e13-0b58-4341-8056-318073ca72b9"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:02:05.618
4a729533-56dd-4659-92d8-30d620511a8a	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:02:09.028
ff55ae0d-7d10-4dad-bf5a-5662cc323877	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:02:08.946
f3899420-c733-4bc8-8fcf-c91213331964	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:45:33.192
eb5c31ec-bd94-4eec-ae80-d28e4771d61b	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:45:33.069
5d02d943-fc93-4515-9358-b5b019d56164	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:45:36.849
6faaf04b-5add-4268-8d94-3252c1930d19	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:45:36.944
86900102-e407-4761-8b87-2b842c13c6d7	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 01:27:59.164
e8722df0-96e6-4832-8c88-8522189a8632	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 01:27:59.271
cc9bb48d-7119-4f61-aa62-f37fea1d9729	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1755779081929_s5ho6s7ju	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 12:24:41.93
5a8f7f87-fb4b-4466-9684-4fca4e3573fe	session	{"action": "start", "pagesVisited": 0}	\N	session_1755779081929_s5ho6s7ju	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 12:24:40.779
ddd10e8a-77e9-49df-8b85-3917b066fc10	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 15:51:37.091
b5a24c4d-ef4e-4ddc-9bed-bc21ed1968b3	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 15:51:37.153
4db75c8b-7fd3-4ad0-81de-1f3f54646d6d	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:07.348
cca214ef-23bd-48d9-8b70-0afb0ee251fe	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:07.289
f46df3bc-e6b9-483b-bf16-5ffafecfa049	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:09.155
c9c6b06c-b140-4d44-901e-f5855a228d38	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:09.181
8ddf207f-a741-480c-83da-a3ec4c72ce02	page_view	{"pagePath": "/your-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/your-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:10.995
7c77e277-97c8-4a86-8841-0fd5ecde1ebd	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:11.027
8e7ae962-aaff-4ec6-9865-541327f92b0b	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:19.279
1f2180e1-8997-4bb4-805f-f4ab2bb566e0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:19.323
f9a567bd-e4d6-45a6-bd3c-fb7c937c2d07	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:21.409
6b7da0a9-30e6-4ac1-aa51-52e5fc5cb9ea	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:21.382
511abaff-7e25-43a9-8e85-033d81dbd886	page_view	{"pagePath": "/jobs", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/jobs"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:43.792
0151c6bd-ef92-43fa-9a53-fd186639c3ca	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:43.819
d2ccdb27-e2b6-4752-b85c-cfd9c6754ec8	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:51.441
5d3ababf-dcba-4f03-9bc5-93e3fd136de0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:51.473
6ff621cb-1774-43c1-abca-27cd7d68d359	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:21:38.089
66cdb99a-78d2-4d1e-9ac1-a76e2e1ccd4a	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:21:38.139
68401348-a68e-4124-bfb1-3ca69a15aae7	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:13.351
3a3093df-2348-41fc-819d-2c5e8e100dc0	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:13.461
41ef0e28-2da2-44d8-b2d3-e924b2789e21	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:17.818
d9730f5c-3a67-4604-871d-0f668dee5781	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:17.921
807f4e3a-d92a-425c-9eb2-af261f8ce206	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:18.372
45c124e6-c6a3-4863-bea3-76fbbb15e084	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:18.467
24367ecd-3f85-4956-acb7-d6de3474b74e	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:30:30.978
e383aa30-db64-4f46-a06b-cb90389dfccd	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:30:30.841
ad737417-ef98-4abb-9ef4-6005c75c64b5	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:38:43.514
2d1cc0c2-cda0-4512-ae65-769d53b9b875	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:38:43.416
4a65553a-1443-4c8a-8a7b-2f715fba1980	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:07.25
70548c9e-10b4-4d83-b6bf-5d03d3744b56	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:07.172
6b437191-3157-4b7b-9713-cf8053120ad4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:26.355
7c02c6fb-0af0-4587-aea0-55051d405501	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:26.281
1aaf2558-5e5a-49de-8fc9-ba00ca8e289b	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:27.638
774af89f-aee2-4dee-9121-75cf1fc47adb	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:27.714
dbefd447-af26-446f-8137-9ada2ac9e50b	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:40:00.994
0997a4bd-e984-47e4-b3fa-9d745b3002d4	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:40:01.038
09c112fd-398b-4fdc-88e4-3e305fac9e5d	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:48:29.792
b405544b-7ea8-41bf-b057-eaf6748a396c	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:48:29.872
0b8518a8-5b55-4d2a-ab98-6c8ca014a798	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:57:12.706
5c685aa3-b29a-4e61-b9dc-ef1d3e9bc1c0	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:57:12.633
01f2ee73-e5b7-4c04-a11a-2ae2e184fecd	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 20:31:57.784
bfa2a663-719c-4440-9a39-7cdd29153837	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 20:31:57.886
9a07ffd2-f9b5-4c16-94be-90f883d6026a	page_view	{"pagePath": "/my-pipeline", "pageTitle": "Pipeline: Long-Term Care Jobs", "pageLocation": "https://pipelineworkforce.com/my-pipeline"}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 20:56:40.19
afc01e5a-6760-4649-846f-167d79c499f9	session	{"action": "start", "pagesVisited": 0}	\N	session_1754326807053_05ckr8kpi	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 20:56:40.296
\.


--
-- Data for Name: applied_jobs; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.applied_jobs (id, "userId", "jobId", "appliedAt") FROM stdin;
\.


--
-- Data for Name: apply_clicks; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.apply_clicks (id, "jobId", "userId", "ipAddress", "userAgent", "clickedAt") FROM stdin;
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.candidates (id, email, "userId", "healthcareRole", "certificationStatus", "zipCode", address, "maxTravelDistance", "workType", "shiftType", "currentJobStatus", step, "isOnboarded", "isActive", "hourlyRate", "yearlySalary", "payLocationBased", "workSettingExperience", "preferredSetting", "thrivingFactors", "jobFrustationNotes", "referredBy", "createdAt", "updatedAt", "firstName", "lastName") FROM stdin;
\.


--
-- Data for Name: experiences; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.experiences (id, "candidateId", employer, role, "startDate", "endDate", "isCurrent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: job_views; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.job_views (id, "jobId", "userId", "ipAddress", "userAgent", "viewedAt") FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.jobs (id, title, description, location, company, salary, requirements, benefits, status, "createdAt", "updatedAt", "zipCode") FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.projects (id, name, description, status, "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: saved_jobs; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.saved_jobs (id, "userId", "jobId", "savedAt") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.tasks (id, title, description, status, "dueDate", "createdAt", "updatedAt", "projectId", "assignedToId") FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.user_sessions (id, "userId", "ipAddress", "userAgent", "startedAt", "endedAt") FROM stdin;
b5861f08-681d-4b44-aa3c-2faf19828288	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:00:07.132	\N
97f57359-2765-49cc-9edb-5dbfaa2ee2c2	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 17:42:21.68	\N
bd297054-3131-499b-9c5b-d9806524d548	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 17:42:27.944	\N
cf5d7c0d-d64d-4eac-a135-96e94c3f4fb7	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 17:49:07.088	\N
174eef37-7373-440e-b47d-3c370c1c9b55	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 18:07:23.695	\N
a828eff0-23b5-4477-becb-398cb75f7975	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 18:42:21.13	\N
75a6753c-4a41-4451-ab7d-aa299e17ede6	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 19:45:49.793	\N
1e3cade9-d4f8-4b33-b5e9-6f65beceb5d0	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 19:45:50.24	\N
285b7447-0e89-438b-aa03-90ba0eb11515	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 10; NEN-LX1 Build/HUAWEINEN-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.105 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/468.0.0.8.112;FBCX/modulariab;]	2025-08-04 19:48:45.618	\N
e6aa1371-8085-495b-bc4a-1bef30ba9ef8	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 10; NEN-LX1 Build/HUAWEINEN-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.105 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/468.0.0.8.112;FBCX/modulariab;]	2025-08-04 19:48:47.67	\N
c5933a0e-876f-4b7b-ab7e-5590e5afbafb	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:10.725	\N
d18b4635-ed84-4adb-9a8d-6d162e1a2f6f	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 20:01:56.834	\N
e4c7f273-8061-40fd-8532-d6b5e39e0dc9	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 20:04:33.091	\N
0ca517c5-bfe0-411f-bbbb-77e85fb7be75	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 22:31:05.231	\N
a09a0f76-ac52-4673-a81e-f0c0c29220d3	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:47.586	\N
98951efe-f622-44f4-aca2-c998774151b0	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:31:49.648	\N
d9547670-a500-4cbd-90c0-1a49c8b421d7	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36	2025-08-04 22:32:23.009	\N
0485a867-533d-40c2-8f64-63aea07e52bc	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36	2025-08-04 22:32:23.657	\N
57a2e79f-5171-4b0c-8e42-83c1c5f31fa9	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0	2025-08-04 22:32:52.514	\N
f99566dd-44c6-4665-8801-9c2684f14bf6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0	2025-08-04 22:32:53.441	\N
df108f1f-14a9-4bca-99d7-57523d2a5d0d	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:34:47.876	\N
0cc68f02-93ea-4a38-9afa-b31f7447c383	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:34:48.76	\N
a6836e0d-b8da-4b67-9325-e7b30270539a	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	2025-08-04 22:40:13.746	\N
cb9be628-649e-46c1-a6e4-60de6de16bdc	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-04 22:51:28.106	\N
9b93215c-16c1-4c41-97b1-58bf44f8dd30	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-04 22:51:28.664	\N
dad420e0-1187-4613-b654-bb9257515eb2	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:54:02.725	\N
f8174bef-a4c6-4eab-a01b-a7cddeb72844	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 22:54:03.029	\N
79b126d4-5a5a-44ff-9034-b94e7e571788	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:04:03.86	\N
87d31671-a0d1-4a7f-95b4-6fe0f63e5a37	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1	2025-08-04 23:05:15.207	\N
813cb011-12bf-4a51-b18d-c21852d019be	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 23:05:46.153	\N
e6272d1f-044d-45a5-95e7-7fa07f068100	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-04 23:05:46.847	\N
6e8aab6d-9513-4ba6-ab70-3d6e42e90311	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-04 23:12:01.502	\N
05de2773-4a93-41d3-b677-0bc7b27626fc	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:13:22.996	\N
f41deb56-b15a-45b2-9450-9d9a72cde9fc	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:25:13.643	\N
ddd70852-d8bb-4373-8c22-b88a513f3699	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:31:10.19	\N
c60c476d-9b44-4130-982e-7e2d3b157dbe	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-04 23:33:01.802	\N
63938182-56fe-4aec-87db-02e241e5f3c7	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-04 23:33:03.074	\N
6a589603-45d5-43ce-b995-c1f28d807348	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-04 23:33:48.013	\N
7d3ab0af-dd9b-42eb-9179-f7464835a99c	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-04 23:33:48.67	\N
2d0eb993-ba2a-438e-8b5a-f47936969c96	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:39:12.054	\N
b68009ce-6911-4b80-a77b-9b0b09a43f42	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 14; Hisense U71 Pro Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-04 23:40:01.765	\N
c2f854e6-b088-47e4-96c8-c496c9e7a9e4	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 14; Hisense U71 Pro Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-04 23:40:04.198	\N
80cc5f10-6170-4ba4-9da6-d2953dbde492	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-04 23:49:15.393	\N
214ae1c1-b6a2-4276-9679-ae367b92249f	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 00:17:37.503	\N
93700a56-5ade-4f24-951e-c37ebe161b17	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0	2025-08-05 00:41:58.618	\N
77273f9f-dde6-4a6e-a92d-068420b3eee4	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0	2025-08-05 00:41:59.358	\N
28d768ff-17fc-4842-a7cf-93b879f26906	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.92 Safari/537.36	2025-08-05 01:40:34.187	\N
e51fe2c2-5c37-4f6d-b205-9927d907e040	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.92 Safari/537.36	2025-08-05 01:40:35.032	\N
3206e657-65b8-4931-af5e-19529e835459	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.97 Safari/537.36	2025-08-05 01:41:03.994	\N
b5cb7b83-fa63-42da-8ece-944aae50958d	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.50 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/503.0.0.69.76;]	2025-08-05 05:30:40.426	\N
53dcfc12-d7aa-441a-bccc-b638261a56ef	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.50 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/503.0.0.69.76;]	2025-08-05 05:30:41.686	\N
3f170032-55fd-4387-a6e7-fff6b121dfe4	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:16:31.862	\N
d6ffc29d-2a1d-4a7c-a800-9360d4ee7027	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:16:36.189	\N
c71a8cff-d38f-47f9-be32-776e94574a24	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:17:27.225	\N
0d9a12e1-9035-49c5-979c-10034244c9a7	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 06:17:31.568	\N
7dea9f48-92ca-40cf-991a-3379df8bc731	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.179 Mobile Safari/537.36	2025-08-05 06:18:31.804	\N
fb238e43-d6b8-4d37-81ce-5eb7ce50ef30	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-A032F Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.179 Mobile Safari/537.36	2025-08-05 06:18:34.701	\N
198d3a20-a036-4d94-bfe5-ca25f6b23535	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 09:47:37.206	\N
ef15be64-6ec2-4951-bb8a-c0693f14f9de	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 09:49:34.983	\N
30928eb3-f048-4eed-91c1-26d00b8fc767	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 10:00:46.233	\N
1b047137-366b-4128-8122-2fae9ee409f8	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2025-08-05 10:00:50.139	\N
f06b13bc-f480-4a2a-b86a-9c22fec4d438	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 10:56:05.281	\N
60e567db-3e13-44ca-976d-4ee1fd6db694	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 10:56:05.431	\N
3148469d-7b28-48e6-9121-6df8edbfa55d	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 11:30:42.927	\N
3403598a-4105-4ea7-80cc-d4a09ca4a772	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A235F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/470.0.0.3.109;FBCX/modulariab;]	2025-08-05 12:15:30.735	\N
d72fa2c8-7917-43d7-a56a-655083439ef2	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A235F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/470.0.0.3.109;FBCX/modulariab;]	2025-08-05 12:15:32.451	\N
6e9072e2-6af9-4542-adb2-9c9bf73447e0	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:50.463	\N
f4f697c2-b744-4ff1-b073-ef3a012b6703	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:50.634	\N
c24bebbf-79c7-47a4-80bb-18f8d863fa0e	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 12:53:54.757	\N
c76d7ebe-a295-4b07-b8a1-0cf9255840cf	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:23.127	\N
3fdf6c5d-ae9e-4993-8fa7-d1ba45c71505	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:23.488	\N
b9e9422e-8931-4924-b2c8-86ad72dabaff	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:08:31.03	\N
d6828a7c-5f79-4f14-aab3-dc9afdacd563	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A135F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/469.0.0.15.116;FBCX/modulariab;]	2025-08-05 13:32:17.7	\N
0af5bcec-8d89-4e8d-b35c-d159bf2ebda1	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 14; SM-A135F Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36[FBAN/EMA;FBLC/en_GB;FBAV/469.0.0.15.116;FBCX/modulariab;]	2025-08-05 13:32:20.074	\N
920e0118-123f-43d6-ba73-97047becdee1	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 13:41:05.233	\N
674b076c-2d6c-48ec-be5c-86875cb4ee75	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:27.018	\N
ef0ec9d2-897c-480d-8e95-62b50a57897e	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-05 13:58:31.426	\N
e29ce1eb-1ae3-403d-81e6-dcc1f6025bb4	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-G781V Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.176 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 14:49:18.835	\N
9b7ad93c-76c9-4411-8f1b-d8c75560de0b	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 13; SM-G781V Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.176 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/524.0.0.52.44;IABMV/1;]	2025-08-05 14:49:19.259	\N
49f0f244-a656-4a76-bdf3-ba7f8265fb58	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-05 15:21:12.347	\N
f0ac202a-5f25-482b-8378-6180b859b900	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2025-08-05 15:21:13.39	\N
8724fcb1-825b-4fa4-bf07-b518369c2bbc	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:02.869	\N
81cd46c7-b51f-4cf5-8aa7-9dbd6b22a428	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:03.303	\N
46ea6655-9250-4f7d-aa08-b212a66ca4f8	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-05 19:22:28.245	\N
e0a8b008-e8b0-4bba-92af-358f2612ae1d	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1	2025-08-05 20:10:01.7	\N
58c503fc-a014-4008-9e4b-787abf32a2cf	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:43:39.482	\N
79a99a2a-4609-4781-bfae-132a03106495	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:43:40.153	\N
c30df21c-c29d-4952-aa74-f2009c3e5395	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:44:04.575	\N
b129354a-63bb-4e1d-8757-4f1e4fb4d692	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:44:05.1	\N
1a08449d-96e3-4b8d-804a-e0c72bc04276	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:49:29.591	\N
479edeb6-1ca9-455e-90a0-98459128b9dc	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Safari/537.36	2025-08-05 21:49:30.105	\N
965f955f-990a-4c45-ac7d-c4e5b6467058	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/518.0.0.36.107;FBBV/769778401;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.1.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]	2025-08-05 22:03:18.392	\N
d22975df-bc72-4879-a340-aae682fb706a	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/518.0.0.36.107;FBBV/769778401;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.1.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]	2025-08-05 22:03:18.648	\N
e64b680b-c4e7-4a7b-a80c-0652b95cf0b9	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-06 12:07:44.565	\N
46b8d2f1-3719-468d-8a4a-3d2c3d01cf37	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-06 12:07:45.788	\N
c8ab976e-db79-400f-aaa1-8672802bcdb4	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:46:24.184	\N
c83aceb0-e8cd-44f8-b001-c54450dfd48e	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:46:25.987	\N
1961f4c8-a354-4541-a7f3-e719d39af242	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:48:47.288	\N
e9010b36-e85e-4e19-8723-31b37c2227ed	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-06 12:48:49.1	\N
157627ef-c498-49d9-9995-4fb10f38cb60	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-06 12:51:46.316	\N
6d8c0309-e86a-4b57-8fef-572ccaad1089	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.6422.60 Safari/537.36	2025-08-06 12:51:47.116	\N
592d6617-96a2-4896-8f9b-2f077ab8e33c	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-06 18:27:40.452	\N
53f27f28-f1b8-4c56-a6c4-c55c9b6ebcf6	\N	172.18.0.1	Mozilla/5.0 (compatible; HubSpot Crawler; +https://www.hubspot.com)	2025-08-07 12:23:37.285	\N
0f7e4366-0eb5-49c6-8520-eea698b90fd2	\N	172.18.0.1	Mozilla/5.0 (compatible; HubSpot Crawler; +https://www.hubspot.com)	2025-08-07 12:23:37.57	\N
a00b3b96-c651-4c35-a79b-92693ee221d0	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-A356E Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 16:00:50.816	\N
ef248374-f257-45ca-9c13-c5a4a32a3ee3	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-A356E Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 16:00:51.534	\N
71a93314-bff7-42cc-86ce-e8288030e086	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A.250705.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 19:08:53.523	\N
d6207702-5bc8-4834-abbc-f78cf2444195	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/BP2A.250705.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.169 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	2025-08-07 19:08:53.951	\N
bf3762bf-ddbe-48f4-909e-c0ca2731d1b9	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36	2025-08-08 04:01:04.748	\N
bd515271-5227-4abf-89fc-e259ae65b624	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36	2025-08-08 04:01:06.481	\N
8073ea7a-aef0-4f3b-bc3f-d23838b89cf4	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	2025-08-08 20:46:18.081	\N
dc385c5d-5128-4068-a4f1-6dacf86d8d28	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.1.0.47.100;FBBV/771349287;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/774983782;IABMV/1]	2025-08-09 15:21:02.586	\N
29205f3a-cd00-4f6a-9c37-5538915586c9	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/524.1.0.47.100;FBBV/771349287;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/774983782;IABMV/1]	2025-08-09 15:21:03.296	\N
9b54cba5-b24e-4a3b-a4ca-18ac316518b0	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 19:42:58.969	\N
07e80371-49c7-42f0-b150-d5d855bd14fa	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-09 19:43:01.526	\N
9fd33f27-9d84-42fe-a2b7-f6eac8ac24da	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:14:49.507	\N
1ddd16ca-e89c-4947-9a83-2c78a6d0a165	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:14:49.849	\N
4c6b093e-ddb1-46eb-b303-6fdc9c141d4d	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:45.892	\N
f6322827-45de-45b6-a393-d311e0618393	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:46.163	\N
c97a2051-19f1-476b-906d-92cca1aefccc	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:17:55.051	\N
4782929a-94a0-49b1-be08-b2fd30b2f98e	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-10 06:18:39.717	\N
4e4fe0e2-bcf4-4092-81c4-35a42d9c4804	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.5 Safari/537.36	2025-08-10 06:49:45.445	\N
9bdf467d-2480-4ed7-b2b3-9389808cc41f	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.5 Safari/537.36	2025-08-10 06:49:49.538	\N
42402704-a647-45ee-af6e-99c9af5d12c0	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:12.596	\N
03c7a40f-2efe-47df-99ef-733307314acf	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:13.835	\N
6a3977ac-31cb-4e0c-81d5-1c7144cbf352	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15	2025-08-11 02:09:21.759	\N
7ff7866f-3a88-4a84-a928-54068f4458e2	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-11 08:44:33.107	\N
2b630a2e-36f0-4fb8-aa3c-a00f15873ba8	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-11 08:44:35.718	\N
09cc7e44-7c8f-49a9-bbba-4774d1eeee38	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:07:58.238	\N
512a863b-e96c-4989-b540-45497d96b0eb	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:07:59.198	\N
2726a936-efdb-4740-a9ac-ab066a0714b9	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36	2025-08-11 09:08:22.587	\N
baab2f62-91c8-47cd-a572-aebc56532c97	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/525.0.0.53.107;FBBV/774177433;FBDV/iPhone14,7;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/776162600;IABMV/1]	2025-08-11 13:01:56.638	\N
929cc7f3-2b67-4e39-a0c5-e7b22fbc87af	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/525.0.0.53.107;FBBV/774177433;FBDV/iPhone14,7;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/776162600;IABMV/1]	2025-08-11 13:01:57.092	\N
db6432c9-e666-4bee-8040-f1392837f574	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-08-12 22:01:08.314	\N
881e607e-d589-4f79-810a-46425cf7a4d4	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	2025-08-12 22:01:08.79	\N
d4d6cd62-8ae5-4288-a975-1137c3002207	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 22:52:57.236	\N
a2022b96-0803-415e-b2e7-1fe1be689c3f	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 22:52:57.57	\N
a20b4815-a155-4aff-8124-4f2b428c78ed	\N	172.18.0.1	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 17:49:16.842	\N
7ffc06bf-3cbc-4d38-a309-41a08779ff99	\N	172.18.0.1	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-13 17:49:20.413	\N
0f9cb28d-2787-4989-9089-1926a95cffb5	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 19:58:13.663	\N
da7f0af0-7f27-47f2-adc9-de7968fd8ff6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 19:58:14.87	\N
3cfac12f-28c9-47df-9cc5-a13901e98d22	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 21:21:24.103	\N
dad2b3a3-0d67-4a10-84ed-05f7c23fb8d9	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36	2025-08-14 19:28:51.455	\N
2e650231-ad48-4620-ac6f-f21769531ac8	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36	2025-08-14 19:29:19.219	\N
56c51b26-f903-4b93-be41-d537b8ca3b6d	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-S938U1 Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.75 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/525.0.0.53.51;IABMV/1;]	2025-08-14 20:15:28.116	\N
a3e07712-7a67-45d3-8b79-c6f12d12de22	\N	172.18.0.1	Mozilla/5.0 (Linux; Android 15; SM-S938U1 Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.75 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/525.0.0.53.51;IABMV/1;]	2025-08-14 20:15:28.521	\N
7b361754-51b4-43d6-9e33-e2644d874c04	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-16 14:04:35.365	\N
7f1b8699-609f-47c1-ab1f-eff8c96397c3	\N	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-16 14:04:35.918	\N
c7dbd282-7b85-4532-9bb5-dbf5d8739255	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 10:03:56.408	\N
4461d2a9-a2d6-4e5c-9527-f5d8940bf756	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 10:03:58.178	\N
5fef19a6-9104-4dbf-93a9-810e259a8d94	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:17:48.279	\N
ee4476e0-b3a0-4324-b364-f38865d0ac32	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:17:50.181	\N
5750ac5a-569d-490b-95ed-3819883e1c09	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:19:57.28	\N
21a9c2c1-d8eb-4bda-9447-63e9c213957a	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 13:19:57.673	\N
98d28b18-7f01-4dc9-a2ca-0b4c6973abf5	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 16:48:28.426	\N
bfad868e-34d9-4a51-b1db-e151d7680545	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 16:48:29.118	\N
927a3f20-4115-421d-9437-f827ad3971be	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36	2025-08-18 17:58:27.391	\N
a2c45cc9-cbbb-49b6-a331-786dee96467c	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36	2025-08-18 17:58:28.498	\N
88fc7446-3543-4b55-9f5f-1c56af1019ae	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 18:37:26.632	\N
9e633caf-0e44-419d-835c-b28e84b5637e	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 18:37:27.805	\N
1fa1ccd4-cc41-4ce3-b7e5-e9bb823d5f28	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 21:10:23.978	\N
e6d301e1-f245-4412-b693-123fb96dfbc7	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 21:10:25.708	\N
a5be97e1-d83b-47f2-ae05-39ea4bc5a7ea	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 23:41:59.926	\N
99b6633c-f2a6-4b31-9e3c-c00c07462f0e	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 23:42:02.408	\N
c50a5061-08a4-4640-9b67-c4c855a5d6e9	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 09:56:24.65	\N
153f3f90-d120-4a20-b0cd-e3a21b7180a8	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 09:56:25.619	\N
e53b06c7-0b64-4ee8-8d45-9383ded19025	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 13:52:18.251	\N
6938adf2-0a53-4948-8c1c-b0c5d2fbe8f1	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 13:52:19.681	\N
cd1a59ba-98c8-40d5-9e68-6df9345cfdf6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-19 20:32:45.392	\N
ad12c68e-12e0-4494-96cb-e9e29fa50bef	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-08-19 20:32:45.798	\N
c1f53216-ba7e-4e99-b93d-d037daa73f08	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-19 21:02:36.179	\N
5656e272-f94f-4960-ad51-761997a79829	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	2025-08-19 21:02:38.164	\N
8b7b7274-1136-4734-9034-bd3b7799d57c	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/375.1.776343893 Mobile/15E148 Safari/604.1	2025-08-20 13:28:47.287	\N
f9245808-c3a4-4e8d-a519-adbd0a11c21e	\N	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/375.1.776343893 Mobile/15E148 Safari/604.1	2025-08-20 13:28:47.567	\N
87795f74-d5a7-40de-b70e-957d189cadcf	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:24.124	\N
45e8f08b-e936-48c0-8b4f-64738d29cb9b	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:24.382	\N
45959d38-62b3-46d5-98dd-65ab758a64dc	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:46.452	\N
79bcc1e1-8999-4517-bd0b-4b6248dccf85	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:53:54.59	\N
a5f1c2e3-4a91-4232-82ba-e0c55b4a213c	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 19:54:03.235	\N
ee418ff9-3d67-4694-8cd9-1600f05e4e1d	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:35.732	\N
5e333e2f-8810-4be5-85d7-c2c7fbb0a3fc	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:40.308	\N
64228d82-4cde-4c52-acc0-e0590a615db7	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:05:51.816	\N
9cf596d1-ddda-45ec-b60b-b6890da06d94	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:06:35.403	\N
763107dc-f3ea-4510-9f2d-37acb1cf5a5a	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:13:15.928	\N
62315e30-a5f2-4817-afd9-004f0dbe2f29	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:25.167	\N
27b7172a-9fa1-4374-823b-473952e4ea7d	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:31.615	\N
c428c1e1-ac1a-4acf-a0fe-20e8c02ebcd4	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:19:38.654	\N
dbb78a1a-048a-4eee-a8fd-717f42b8399b	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:22:22.837	\N
60e77786-f86e-47a0-ad2e-0c9b675b70d1	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:28.362	\N
aa0a1413-8641-4e0d-ae42-6bfdddb04678	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:37.058	\N
7e642f7b-46a0-4903-9c35-79330e8d2875	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:40:57.581	\N
04165804-23b4-4767-b576-759c0533d943	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:41:19.711	\N
51688cf9-68e4-483b-b2c0-ce2e5ebbbb8d	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:55:44.529	\N
58927a70-8287-4545-b5c7-955d8dcc24de	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 20:56:25.392	\N
3e60919b-f3f0-4a7e-ae16-d0f8ece36f1b	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 21:49:40.005	\N
bf2f04b1-45aa-40b9-9698-96265b84baa2	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:44.398	\N
7d1df067-23d7-43dc-b1db-4a9c4485e677	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:45.417	\N
ead86b43-2d52-4c36-a169-a17090260dbd	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:15:56.159	\N
562768fc-13c6-4a17-a7af-ed075fee0ecc	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:02.737	\N
c2342a7b-135a-4367-997c-ffeefa3fdfb3	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:06.247	\N
8bf4eaff-794e-4b41-af65-02317cc2927f	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:16:12.531	\N
25124187-185e-41ce-a52f-01dfe8b85f39	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:23.552	\N
d5274062-0090-440e-b9c7-396b96668fe1	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:27.965	\N
efafe48c-c5b1-435a-8225-a627231a2583	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:34.121	\N
ec4e0778-78a9-4d03-9eef-99d5fdadb6dd	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:18:43.52	\N
a2ff3bab-9b86-453b-88ec-02f42647d2ee	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:46:07.77	\N
d76057ba-a5ef-411c-b09c-e4b42f811b34	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:46:14.688	\N
c3450923-bcf2-42bc-8d6e-a60682c13757	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:35.645	\N
9fc1d387-e0c0-469a-8a14-c3d0abecbefc	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:36.524	\N
70645573-72c7-4b42-9e5e-8a06cec7e6ce	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:36.995	\N
06862a44-70e3-44a6-b482-8d1c130f7032	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:37.953	\N
7eb9457a-5d04-4ee6-95cb-df602f5deceb	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 23:54:48.906	\N
2587a42e-b6e4-47f0-83bc-defad276e48a	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:01:47.973	\N
3bf867e0-51e0-4135-8f8b-f6a41d316459	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:01:52.6	\N
5cae3862-4f43-4873-8c87-209fcf1cef33	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:02:09.029	\N
4bfe4005-4657-4e4f-a44f-a7c41a950971	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:45:33.194	\N
576566ff-78b0-4b3e-b7f5-560cc8062066	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 00:45:36.945	\N
7e7d985b-3ea5-408c-93d8-192de5027910	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 01:27:59.272	\N
72a08be0-7f7b-48f3-8114-e557b7c41a7a	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 12:24:40.78	\N
2369d2e9-bff3-4f2a-90ea-376017a58a5c	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 15:51:37.156	\N
6771266a-7fdf-4127-9fc7-7c0d2cd18ea5	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:07.351	\N
d8d29258-30de-4481-a711-c6d187245da4	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:09.183	\N
6726dd46-e953-4d74-8ff5-79144ce4ddf8	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:11.028	\N
8a237b36-08bf-4432-a7ac-e96e9a95621c	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:19.324	\N
115941be-8895-40bc-beea-0a9993e86ea7	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:21.41	\N
b6db6c7c-16bc-446a-9e10-2e0efdf2257f	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:43.82	\N
3512e4c5-fba0-49e2-a2be-594408d9123e	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 16:44:51.475	\N
f092cc2d-06f7-4211-a864-f0ea4b9bd445	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:21:38.141	\N
865a581e-3585-4824-8f51-ac77c85dcd95	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:13.463	\N
042b2d7f-0846-405f-8fa1-1cc5e2961826	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:17.923	\N
02f088ac-1f54-46a9-acc2-a77641eedac3	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 17:44:18.469	\N
48847317-2bd8-41bf-ae25-aebd9f2c0af5	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:30:30.98	\N
7546a113-4b9c-4c50-a112-4713ac60c2b0	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:38:43.52	\N
957032e9-4b02-4a82-94e9-e7e9cb505f96	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:07.252	\N
e6c8882f-5a95-45b4-a0a1-78e577278285	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:26.357	\N
8d5190a5-fa78-4351-8bc4-320a37aebbed	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 18:46:27.715	\N
2672ae0c-bed5-4d76-9ab5-5b0336958eeb	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:40:01.04	\N
de386643-abfe-4166-b2ed-9f3e362428d2	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:48:29.873	\N
1f3d53c7-f73f-4ca1-b65f-ba10e06455ed	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 19:57:12.707	\N
6747335f-1f2e-4ca1-9cc4-d5f7de0f90af	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 20:31:57.888	\N
b8bb6181-e29b-4ac5-8ba5-aaeb286ab95c	\N	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-21 20:56:40.298	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pipeline_admin
--

COPY public.users (id, email, password, role, "createdAt", "updatedAt", "firstName", "lastName", "emailSubscribed", "unsubscribedAt", "emailVerified", "googleId", "googlePicture") FROM stdin;
480c9e13-0b58-4341-8056-318073ca72b9	admin@pipeline.com	$2b$10$Wo.9B6mzQt0lzVjoBrgXJevQXBONeOlfxUb7TwxVgiBabqC0O0WAe	ADMIN	2025-07-31 16:40:45.817	2025-07-31 16:40:45.817	Admin	User	t	\N	f	\N	\N
00779e12-45f2-4585-9488-52fd86cbbfc2	alex@pipelineworkforce.com		CANDIDATE	2025-08-01 02:12:30.251	2025-08-01 02:12:30.251	Alex	Ostrander	t	\N	f	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: applied_jobs applied_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.applied_jobs
    ADD CONSTRAINT applied_jobs_pkey PRIMARY KEY (id);


--
-- Name: apply_clicks apply_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.apply_clicks
    ADD CONSTRAINT apply_clicks_pkey PRIMARY KEY (id);


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
-- Name: job_views job_views_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.job_views
    ADD CONSTRAINT job_views_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: saved_jobs saved_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: analytics_events_eventType_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "analytics_events_eventType_idx" ON public.analytics_events USING btree ("eventType");


--
-- Name: analytics_events_sessionId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "analytics_events_sessionId_idx" ON public.analytics_events USING btree ("sessionId");


--
-- Name: analytics_events_timestamp_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX analytics_events_timestamp_idx ON public.analytics_events USING btree ("timestamp");


--
-- Name: analytics_events_userId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "analytics_events_userId_idx" ON public.analytics_events USING btree ("userId");


--
-- Name: applied_jobs_jobId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "applied_jobs_jobId_idx" ON public.applied_jobs USING btree ("jobId");


--
-- Name: applied_jobs_userId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "applied_jobs_userId_idx" ON public.applied_jobs USING btree ("userId");


--
-- Name: applied_jobs_userId_jobId_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX "applied_jobs_userId_jobId_key" ON public.applied_jobs USING btree ("userId", "jobId");


--
-- Name: apply_clicks_clickedAt_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "apply_clicks_clickedAt_idx" ON public.apply_clicks USING btree ("clickedAt");


--
-- Name: apply_clicks_jobId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "apply_clicks_jobId_idx" ON public.apply_clicks USING btree ("jobId");


--
-- Name: apply_clicks_userId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "apply_clicks_userId_idx" ON public.apply_clicks USING btree ("userId");


--
-- Name: candidates_email_firstName_lastName_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "candidates_email_firstName_lastName_idx" ON public.candidates USING btree (email, "firstName", "lastName");


--
-- Name: candidates_email_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX candidates_email_key ON public.candidates USING btree (email);


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
-- Name: job_views_jobId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "job_views_jobId_idx" ON public.job_views USING btree ("jobId");


--
-- Name: job_views_userId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "job_views_userId_idx" ON public.job_views USING btree ("userId");


--
-- Name: job_views_viewedAt_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "job_views_viewedAt_idx" ON public.job_views USING btree ("viewedAt");


--
-- Name: jobs_zipCode_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "jobs_zipCode_idx" ON public.jobs USING btree ("zipCode");


--
-- Name: saved_jobs_jobId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "saved_jobs_jobId_idx" ON public.saved_jobs USING btree ("jobId");


--
-- Name: saved_jobs_userId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "saved_jobs_userId_idx" ON public.saved_jobs USING btree ("userId");


--
-- Name: saved_jobs_userId_jobId_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX "saved_jobs_userId_jobId_key" ON public.saved_jobs USING btree ("userId", "jobId");


--
-- Name: user_sessions_startedAt_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "user_sessions_startedAt_idx" ON public.user_sessions USING btree ("startedAt");


--
-- Name: user_sessions_userId_idx; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE INDEX "user_sessions_userId_idx" ON public.user_sessions USING btree ("userId");


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
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: pipeline_admin
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- Name: analytics_events analytics_events_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: applied_jobs applied_jobs_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.applied_jobs
    ADD CONSTRAINT "applied_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: applied_jobs applied_jobs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.applied_jobs
    ADD CONSTRAINT "applied_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: apply_clicks apply_clicks_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.apply_clicks
    ADD CONSTRAINT "apply_clicks_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: apply_clicks apply_clicks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.apply_clicks
    ADD CONSTRAINT "apply_clicks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: job_views job_views_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.job_views
    ADD CONSTRAINT "job_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: job_views job_views_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.job_views
    ADD CONSTRAINT "job_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: saved_jobs saved_jobs_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: saved_jobs saved_jobs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT "saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pipeline_admin
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pipeline_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict zWdoHhrftoCxuf75jJWi5vrGRHQCGQx1DwYYy8n2cV0kgwsycaKtwtFtORu3KuA

