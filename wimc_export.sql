--
-- PostgreSQL database dump
--

\restrict XwqULqzcDfUKLumTMm6jTzSLNcIPl9TVbyFlaJmRKabeoNflngSxPbt5j33AG8Y

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: children; Type: TABLE; Schema: public; Owner: wimc
--

CREATE TABLE public.children (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer NOT NULL,
    birth_date date,
    phone character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    battery integer DEFAULT 100,
    last_latitude double precision,
    last_longitude double precision,
    last_update timestamp without time zone,
    CONSTRAINT children_battery_check CHECK (((battery >= 0) AND (battery <= 100)))
);


ALTER TABLE public.children OWNER TO wimc;

--
-- Name: children_id_seq; Type: SEQUENCE; Schema: public; Owner: wimc
--

CREATE SEQUENCE public.children_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.children_id_seq OWNER TO wimc;

--
-- Name: children_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wimc
--

ALTER SEQUENCE public.children_id_seq OWNED BY public.children.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: wimc
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    description character varying,
    created_at timestamp with time zone DEFAULT now(),
    child_id integer NOT NULL,
    radius integer DEFAULT 200 NOT NULL
);


ALTER TABLE public.locations OWNER TO wimc;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: wimc
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO wimc;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wimc
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: wimc
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    username character varying NOT NULL,
    hashed_password character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO wimc;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: wimc
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO wimc;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wimc
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: children id; Type: DEFAULT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.children ALTER COLUMN id SET DEFAULT nextval('public.children_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: children; Type: TABLE DATA; Schema: public; Owner: wimc
--

COPY public.children (id, name, parent_id, birth_date, phone, notes, created_at, battery, last_latitude, last_longitude, last_update) FROM stdin;
1	Léna	6	2023-01-23	\N	Ma fille	2026-02-03 14:14:37.855052+00	100	44.843325643983675	-0.5558790433433101	2026-02-18 10:48:12.45231
2	Greg o riz	6	2026-02-03	not now	Grade de caporal	2026-02-03 21:08:01.937417+00	100	\N	\N	\N
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: wimc
--

COPY public.locations (id, name, latitude, longitude, description, created_at, child_id, radius) FROM stdin;
16	Maison	44.85813	-0.59534	Domicile familial	2026-02-03 12:42:51.049908+00	1	200
17	Parc Bordelais	44.85205	-0.60285	Parc Bordelais matin	2026-02-03 12:51:47.671324+00	1	200
18	Parc Marceau	44.85931	-0.59172	Parc Marceau apres midi	2026-02-03 12:58:49.367983+00	1	200
19	École Holberton (test zone de conf)	44.84334	-0.55592	\N	2026-02-16 12:59:51.651632+00	1	200
20	École Holberton (test zone de conf)	44.84334	-0.55592	\N	2026-02-17 12:38:38.177677+00	1	200
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: wimc
--

COPY public.users (id, email, username, hashed_password, created_at) FROM stdin;
1	user@example.com	string	$2b$12$zCBHAZpq0rkLggQ6QvXmX.SkHU71uBgBYgSsfsrKu/vNKpGEHKY9G	2026-01-25 19:57:52.226882+00
2	thomas@test.com	thomas	$2b$12$wjXw6XMyqk5WZlaAXvrcsulXNdP/MkcfZ1RzsWL2j6rxCl1yp4tfW	2026-01-25 19:58:04.943021+00
3	postman@test.com	postman	$2b$12$Dr6MkxdIqYXSujVJ51qJO.UX/iwxs0YuXqNY925.vIXUKxiD1rGRW	2026-01-26 21:11:03.369625+00
5	test@wimc.com	test_user	$2b$12$ymOLG1JiQwicS5QxEiDOjepbENonW8ZI86vIG7N3gAA.HYpc.iK0C	2026-02-02 14:11:51.967535+00
4	marie@wimc.com	marie_dupont	$2b$12$NS.5MMKiuwaIOX/wHQMnIuAbxrMSuc2yHJl3Q1pVrIibPkKGxpraS	2026-02-02 12:26:26.473343+00
6	decourtthomas@orange.fr	thomas_decourt	$2b$12$6XVQcVOFB..Lw/uOhU13L.CRJ4U7PZHIeBUITTwY.J9bGt/m/cQ2i	2026-02-03 12:13:59.837582+00
7	papa@wimc.com	papa_test	$2b$12$2G3siB.YP/3h.4tiVFq7OOkcI1HjTYRHVX0ylI61AIxNvd0nAbiYq	2026-02-03 12:19:46.546457+00
8	decourttthomas@gmail.com	thomasLéna	$2b$12$1d0UvJSYq6zQOtYjh0H6AezIvLF1NrTHbuHB6IjtgYuCCne.jmYJC	2026-02-03 13:51:52.301623+00
9	test@example.com	testuser	$2b$12$ORwODmef/tAKN1oj/LpIUeZCwFZsfVP9Ein/rdPwwQubJKYi5tCF.	2026-02-09 14:23:00.332849+00
\.


--
-- Name: children_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wimc
--

SELECT pg_catalog.setval('public.children_id_seq', 2, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wimc
--

SELECT pg_catalog.setval('public.locations_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wimc
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: children children_pkey; Type: CONSTRAINT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_children_parent_id; Type: INDEX; Schema: public; Owner: wimc
--

CREATE INDEX idx_children_parent_id ON public.children USING btree (parent_id);


--
-- Name: idx_locations_child_id; Type: INDEX; Schema: public; Owner: wimc
--

CREATE INDEX idx_locations_child_id ON public.locations USING btree (child_id);


--
-- Name: ix_locations_id; Type: INDEX; Schema: public; Owner: wimc
--

CREATE INDEX ix_locations_id ON public.locations USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: wimc
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: wimc
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: wimc
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: children children_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: locations locations_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wimc
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XwqULqzcDfUKLumTMm6jTzSLNcIPl9TVbyFlaJmRKabeoNflngSxPbt5j33AG8Y

