<div align="center">

# 🚀 TextApp — Production-Grade 3-Tier AWS Infrastructure

### A hands-on DevOps project: designing, securing, and deploying a real 3-tier architecture on AWS from scratch — no Terraform, no shortcuts, pure infrastructure engineering.

[![AWS](https://img.shields.io/badge/AWS-VPC%20%7C%20EC2%20%7C%20ALB-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Django](https://img.shields.io/badge/Backend-Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Nginx](https://img.shields.io/badge/Web%20Server-Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
[![HTTPS](https://img.shields.io/badge/SSL-ACM%20Secured-1E90FF?style=for-the-badge&logo=letsencrypt&logoColor=white)](https://aws.amazon.com/certificate-manager/)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)](https://textapp.haseebxdev.online)

</div>

---

## 📌 What is this project, actually?

> ⚠️ **Important:** This is **not** a project about web design or application logic. The application code (a simple text-insert/list tool) is intentionally minimal — it exists purely as a vehicle to demonstrate something bigger: **a secure, production-style cloud infrastructure built manually, from the ground up.**

The real deliverable here is the **infrastructure** — a fully isolated AWS network, layered security, a load-balanced HTTPS entry point, and private compute resources that are never directly exposed to the internet. This is the kind of setup real companies run in production.

---

## 🧠 The Core Idea

Most tutorials show you how to launch *an* EC2 instance and call it a day. This project answers a harder, more realistic question:

**"How do you deploy an application the way a real company would — securely, with proper network isolation, encrypted traffic, and no single point of unnecessary exposure?"**

---

## 🏗️ Architecture Overview

```
                        🌐 User → 🔒 HTTPS → GoDaddy DNS
                                     │
                                     ▼
                        ┌──────────────────────┐
                        │  Internet Gateway     │
                        └──────────┬───────────┘
                                   ▼
        ┌───────────────────  PUBLIC SUBNET  ───────────────────┐
        │                                                        │
        │   ┌────────────────────────────────────────┐          │
        │   │   Application Load Balancer (HTTPS)      │          │
        │   │   /*  → Frontend    /api/* → Backend      │          │
        │   └───────────┬──────────────┬───────────────┘          │
        │               ▼              │                          │
        │   ┌──────────────────┐        │      ┌────────────────┐ │
        │   │  Frontend EC2     │        │      │  Bastion Host   │ │
        │   │  React + Nginx    │        │      │  (Admin SSH only)│ │
        │   └──────────────────┘        │      └────────┬────────┘ │
        │                               │               ┊ SSH tunnel│
        └───────────────────────────────┼───────────────┼──────────┘
                                         ▼               ┊
        ┌───────────────────  PRIVATE SUBNET  ───────────┊──────────┐
        │                                                 ┊          │
        │   ┌──────────────────┐        ┌────────────────▼──────┐   │
        │   │  Backend EC2      │───────▶│  Database EC2         │   │
        │   │  Django + Gunicorn│  :5432 │  PostgreSQL            │   │
        │   └──────────────────┘        └────────────────────────┘   │
        │        no public IP · no direct internet access             │
        └───────────────────────────────────────────────────────────┘

Legend:  ──▶ live user traffic     ┊┊▶ admin-only SSH access (bastion)
```

---

## 🔐 Why Every Piece Exists (the "why", not just the "what")

| Component | Purpose |
|---|---|
| **VPC** | A fully isolated private network — nothing here shares infrastructure with anyone else on AWS. |
| **Public Subnet** | Hosts only what *must* face the internet: the Load Balancer and the Frontend. |
| **Private Subnet** | Hosts the Backend and Database — **zero public IPs, zero direct internet exposure**. |
| **Internet Gateway** | The only door in/out of the public subnet. |
| **NAT Gateway** | Lets private instances reach the internet *outbound only* (e.g. installing packages) — nothing can connect **in**. |
| **Application Load Balancer** | Single HTTPS entry point. Terminates SSL, and path-routes traffic: `/api/*` → Backend, everything else → Frontend. |
| **ACM Certificate** | Full HTTPS encryption, auto-renewed, with automatic HTTP → HTTPS redirect. |
| **Bastion Host** | A dedicated, locked-down jump server so admins can reach private servers — **without ever giving them a public IP**. This path never touches user traffic. |
| **Security Groups** | Every layer only accepts traffic from the layer directly above it (least-privilege by design). |
| **Systemd (Gunicorn)** | Backend runs as a managed service — auto-restarts on crash or reboot, just like production. |

---

## 🛡️ Security Model (the actual point of this project)

```
Internet  ──▶  ALB (public)  ──▶  Frontend (public)
                    │
                    └────────▶  Backend (private, no public IP)
                                     │
                                     └────▶  Database (private, no public IP)

Admin  ──▶  Bastion (public, locked to admin IP)  ┄▶  Backend / Database (SSH tunnel only)
```

- 🔒 Backend & Database have **no public IP** — they physically cannot be reached from the internet.
- 🔑 Admin access flows through a **separate, isolated bastion path** — never mixed with live application traffic.
- 🧱 Each **Security Group** only trusts the specific layer above it — a compromised frontend still can't talk to the database directly.
- 🌐 All external traffic is **HTTPS-only**, with automatic redirect from HTTP.

---

## ⚙️ Tech Stack

- **Frontend:** React (built & served via Nginx)
- **Backend:** Django + Django REST Framework, served via Gunicorn (systemd-managed)
- **Database:** PostgreSQL (self-hosted on EC2, private subnet)
- **Networking:** AWS VPC, public/private subnets, IGW, NAT Gateway, Route Tables
- **Load Balancing & SSL:** AWS Application Load Balancer + AWS Certificate Manager
- **DNS:** GoDaddy (CNAME → ALB)
- **Access Control:** Bastion host + per-layer Security Groups

---

## 📂 Repository Structure

```
textapp/
├── frontend/          # React application
├── backend/           # Django REST API
├── .gitignore
└── README.md
```

> Note: `.env`, `venv/`, `node_modules/`, and all `.pem`/`.ppk` key files are intentionally excluded from this repo for security. See `.env.example` for required environment variables.

---

## 🌍 Live Deployment

**🔗 [textapp.haseebxdev.online](https://textapp.haseebxdev.online)**

Fully deployed, HTTPS-secured, and running on the architecture described above.

---

## 💡 What This Project Demonstrates

✅ Manual VPC design (no Terraform/CloudFormation — every resource configured by hand to build real understanding)
✅ Public/private subnet isolation done correctly
✅ Secure remote access patterns (bastion host, no exposed SSH)
✅ Production-style process management (systemd)
✅ End-to-end HTTPS with a load balancer and path-based routing
✅ Custom domain integration with a real DNS provider

---

<div align="center">

**Built as a hands-on DevOps learning project — every component configured, tested, and debugged manually.**

</div>