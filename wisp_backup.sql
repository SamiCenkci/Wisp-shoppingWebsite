--
-- PostgreSQL database dump
--

\restrict OapF0nJjPKiCDi69cvBL61RaTrQeBP8z4b7w89oCmNosby02WooMpltr6xBd8Y1

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: listing_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    listing_id uuid NOT NULL,
    url text NOT NULL,
    caption text,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price_ore integer NOT NULL,
    category text NOT NULL,
    subcategory text,
    condition text NOT NULL,
    county text NOT NULL,
    municipality text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    ad_type text DEFAULT 'sale'::text NOT NULL,
    CONSTRAINT listings_ad_type_check CHECK ((ad_type = ANY (ARRAY['sale'::text, 'giveaway'::text]))),
    CONSTRAINT listings_condition_check CHECK ((condition = ANY (ARRAY['new'::text, 'like_new'::text, 'good'::text, 'fair'::text]))),
    CONSTRAINT listings_price_ore_check CHECK ((price_ore >= 0)),
    CONSTRAINT listings_status_check CHECK ((status = ANY (ARRAY['active'::text, 'sold'::text, 'expired'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    attachment_url text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL
);


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    type text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tokens_type_check CHECK ((type = ANY (ARRAY['email_verify'::text, 'password_reset'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    avatar_url text,
    email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    display_name text DEFAULT ''::text NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    birth_year text DEFAULT ''::text NOT NULL,
    gender text DEFAULT ''::text NOT NULL,
    street_address text DEFAULT ''::text NOT NULL,
    postal_code text DEFAULT ''::text NOT NULL,
    city text DEFAULT ''::text NOT NULL,
    country text DEFAULT 'Norge'::text NOT NULL
);


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, listing_id, buyer_id, seller_id, updated_at) FROM stdin;
993acaab-d9af-4e39-904e-ac99134d853b	630b549e-38df-49d7-a529-f85eee88aad1	80eabc12-cae9-4390-8c75-6ef97bec6cce	ca5cb2e6-9573-4159-968b-d94a724326e7	2026-06-22 14:44:09.915722+02
a5f84fe8-84ac-4f7e-99f6-875d03f868a2	630b549e-38df-49d7-a529-f85eee88aad1	fa87ccb1-287f-426a-83b0-9542c3492087	ca5cb2e6-9573-4159-968b-d94a724326e7	2026-06-22 14:44:41.81886+02
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favorites (id, user_id, listing_id, created_at) FROM stdin;
a8910387-e99a-4b74-bd7d-4ee8d45e5d5d	ca5cb2e6-9573-4159-968b-d94a724326e7	630b549e-38df-49d7-a529-f85eee88aad1	2026-06-22 13:50:52.930696+02
cc79ae4b-6c76-4c02-8226-51e24cf50716	fa87ccb1-287f-426a-83b0-9542c3492087	630b549e-38df-49d7-a529-f85eee88aad1	2026-06-22 13:54:15.665559+02
c9949e9e-7406-409c-8a6f-5e7797eeba95	80eabc12-cae9-4390-8c75-6ef97bec6cce	630b549e-38df-49d7-a529-f85eee88aad1	2026-06-22 14:31:07.606164+02
\.


--
-- Data for Name: listing_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_images (id, listing_id, url, caption, sort_order) FROM stdin;
1eee122f-1c73-473b-bfd6-8c2ceee0966b	630b549e-38df-49d7-a529-f85eee88aad1	https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/a62604ee-bff5-4e04-a38e-4564f67fc14d-0obRRSb9ASkugzBRb5DC1Jbg.jpg	\N	0
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listings (id, user_id, title, description, price_ore, category, subcategory, condition, county, municipality, created_at, updated_at, status, ad_type) FROM stdin;
630b549e-38df-49d7-a529-f85eee88aad1	ca5cb2e6-9573-4159-968b-d94a724326e7	Macbook air m5 	Selger en macbook air m5	1299900	Torget	\N	like_new	Oslo	Oslo	2026-05-31 18:24:37.688695+02	2026-05-31 18:24:37.688695+02	active	sale
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, sender_id, content, read_at, created_at, attachment_url, attachment_name) FROM stdin;
b00abfae-2d1a-43fb-9c6a-49e02526e30a	a5f84fe8-84ac-4f7e-99f6-875d03f868a2	fa87ccb1-287f-426a-83b0-9542c3492087	Hei!	2026-06-22 13:54:31.790002+02	2026-06-22 13:54:23.228573+02		
8fabcb1a-cb0e-465f-a2d2-1817a63dfb30	a5f84fe8-84ac-4f7e-99f6-875d03f868a2	ca5cb2e6-9573-4159-968b-d94a724326e7	Hei!!	2026-06-22 13:55:00.126221+02	2026-06-22 13:54:52.868756+02		
26eb7287-f352-49e7-94e4-b164196d0478	a5f84fe8-84ac-4f7e-99f6-875d03f868a2	fa87ccb1-287f-426a-83b0-9542c3492087	Hei	2026-06-22 14:24:34.741446+02	2026-06-22 14:24:21.452234+02	https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/de15c97d-a2d9-4df2-847e-4fccc4b5b718-Sami_Cenkci_CV.pdf	Sami_Cenkci_CV.pdf
bbac42aa-03e2-41a9-ab77-92d3b1d7cc93	993acaab-d9af-4e39-904e-ac99134d853b	80eabc12-cae9-4390-8c75-6ef97bec6cce	qssadasdasd	2026-06-22 14:31:24.234709+02	2026-06-22 14:31:13.566261+02		
4dc65063-4320-4368-b120-90fc87b2cc91	993acaab-d9af-4e39-904e-ac99134d853b	ca5cb2e6-9573-4159-968b-d94a724326e7	adsdasd	2026-06-22 14:40:13.938784+02	2026-06-22 14:38:15.847879+02		
2076d95a-26b3-4386-b20e-65a52a063ad6	993acaab-d9af-4e39-904e-ac99134d853b	80eabc12-cae9-4390-8c75-6ef97bec6cce	sadasdasda	2026-06-22 14:40:36.594739+02	2026-06-22 14:40:19.896582+02		
e96a6646-358e-41b8-8524-564f334d4ea6	a5f84fe8-84ac-4f7e-99f6-875d03f868a2	ca5cb2e6-9573-4159-968b-d94a724326e7	ASDASD'	2026-06-22 14:44:20.169231+02	2026-06-22 14:44:12.996765+02		
43aad26f-9e55-46c4-a559-2d4e92fd483c	993acaab-d9af-4e39-904e-ac99134d853b	ca5cb2e6-9573-4159-968b-d94a724326e7	aSADAS	2026-06-22 14:44:50.09018+02	2026-06-22 14:44:09.912579+02		
5a82350d-7921-4917-8541-ab9033b5bfa0	a5f84fe8-84ac-4f7e-99f6-875d03f868a2	fa87ccb1-287f-426a-83b0-9542c3492087	SDFSDFSDF	2026-06-22 14:44:57.951155+02	2026-06-22 14:44:41.815469+02		
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tokens (id, user_id, token, type, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, name, avatar_url, email_verified, created_at, display_name, bio, phone, birth_year, gender, street_address, postal_code, city, country) FROM stdin;
3897d4d3-ffa2-410c-9f08-fdcc961f9402	test@example.com	$2a$10$zZoaTDz3UudGc/1788AgOONqtaIaooNpIGDL7pVaKpirV/qPV0Oze	Test User	\N	f	2026-05-31 13:07:05.072217+02									Norge
ca5cb2e6-9573-4159-968b-d94a724326e7	samicenkci02@gmail.com	$2a$10$zaToOfSHQzAiPLbaEjTco.6dseWAm8sdUHXeE2R82WMFX1CssKb6m	Sami	\N	f	2026-05-31 14:00:36.08052+02									Norge
4480e320-e48e-4baa-934f-b20dae2ff3e4	seller@test.com	$2a$10$hJbZAdPXDD0E2CUhPpzu1OX8m0CRic3KNdE0ADTf9FQ/fFeAoMuMe	Test Seller	\N	f	2026-05-31 19:29:33.279129+02									Norge
b024d083-06f3-4c80-8516-9d953a0d8a4a	buyer@test.com	$2a$10$iubyZQ6lqjDPQywYxRdm2uQuiYlcj3E1smm54AvpWByud.hbNSHPy	Test Buyer	\N	f	2026-05-31 19:29:33.32472+02									Norge
fa87ccb1-287f-426a-83b0-9542c3492087	hackersscx@gmail.com	$2a$10$lJPqgym67aipEXaHeWLTz.jejLjvzgCkskY089hwma85CJW0wJjUa	asdasda	\N	f	2026-06-22 13:54:04.276481+02									Norge
80eabc12-cae9-4390-8c75-6ef97bec6cce	samicenkci0@gmail.com	$2a$10$ldXkKxlE9BI9gAAF4v6nX.gq1SBxUMp1wGB6aRI0BCK0.LpYZJq5i	saas	\N	f	2026-06-22 14:31:00.868514+02									Norge
\.


--
-- Name: conversations conversations_listing_id_buyer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_listing_id_buyer_id_key UNIQUE (listing_id, buyer_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: listing_images listing_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_images
    ADD CONSTRAINT listing_images_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_token_key UNIQUE (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_favorites_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);


--
-- Name: idx_images_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_listing ON public.listing_images USING btree (listing_id);


--
-- Name: idx_listings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_category ON public.listings USING btree (category);


--
-- Name: idx_listings_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_created ON public.listings USING btree (created_at DESC);


--
-- Name: idx_listings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_user ON public.listings USING btree (user_id);


--
-- Name: idx_messages_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conv ON public.messages USING btree (conversation_id);


--
-- Name: idx_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_token ON public.tokens USING btree (token);


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listing_images listing_images_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_images
    ADD CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listings listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tokens tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OapF0nJjPKiCDi69cvBL61RaTrQeBP8z4b7w89oCmNosby02WooMpltr6xBd8Y1

