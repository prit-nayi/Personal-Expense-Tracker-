# Personal Expense Tracker: Bugs, Flaws & Fix Spec

Found by reading the code (backend and frontend). The test suite was **not run**.
Severity: **Crit** > **High** > **Med** > **Low**. The "Fix" column is the spec to implement.

Paths are relative to `backend/app/` unless they start with `frontend/`.

---

## Phase 1. Security (S)

| ID | Sev | File | Problem | Fix |
|---|---|---|---|---|
| S1 | High | `core/config.py`, `main.py` | `"*"` is in the default CORS origins and `allow_credentials=True`. | Remove `"*"`. Default to the localhost origins only. Read `BACKEND_CORS_ORIGINS` from env as a JSON list. Set `allow_methods=["GET","POST","PUT","DELETE"]` and `allow_headers=["Authorization","Content-Type"]`. **Manual:** put the Vercel URL in the Render env var. |
| S2 | High | `services/budget_service.py` `create_budget` | Category is looked up by id only. A user can attach a budget to another user's custom category and read its name, icon and color. | Filter `or_(Category.user_id == user_id, Category.user_id.is_(None))`. Return 404 if not found. |
| S3 | Med | `services/category_service.py` update/delete | Looks up by id only, then returns 403 for other users' categories. This confirms the id exists. | Filter by ownership in the query. Return 404 for another user's category. Keep 403 for system categories. |
| S4 | Med | `core/security.py`, `requirements.txt` | `python-jose==3.3.0` has known vulnerabilities. `How_It_Works.md` claims PyJWT. | Replace with `PyJWT`. Keep the same function signatures. Catch `jwt.PyJWTError`. Remove `python-jose`. |
| S5 | Med | `api/v1/exports.py` | CSV injection. A description like `=HYPERLINK(...)` runs in Excel. | For text cells (description, notes, tags, account and category names) starting with `= + - @` or tab/CR, prefix with `'`. |
| S6 | Med | `api/v1/auth.py`, `main.py` | No rate limiting on login/register. | Add `slowapi`: 5/min per IP on `/auth/login` and `/auth/register`. Return 429. Run uvicorn with `--proxy-headers`. |
| S7 | Med | `core/config.py` | Token lifetime is 7 days and the token is kept in `localStorage`. | Default `ACCESS_TOKEN_EXPIRE_MINUTES` to 1440. Keep it env-configurable. |
| S8 | Low | `api/deps.py` | A missing user returns 404, so the frontend 401 handler never fires. | Return 401 `Could not validate credentials`. |

## Phase 2. Performance (P)

Dashboard and list endpoints run tens of queries per request, and each one is a network trip to Neon.

| ID | Sev | File | Problem | Fix |
|---|---|---|---|---|
| P1 | High | `services/account_service.py`, `services/analytics_service.py` | `calculate_account_balance` runs 4 queries per account, and the dashboard calls it per account. | Add `AccountService.get_balances(db, user_id, account_ids) -> dict[id, Decimal]` using one query grouped by `account_id` (conditional sums via `case`) plus one grouped query for transfers-in by `destination_account_id`. Use it in `get_accounts` and the dashboard. Keep `calculate_account_balance` as a wrapper. |
| P2 | High | `services/transaction_service.py`, `api/v1/exports.py` | `_format_transaction_out` lazy-loads account, destination account and category per row, which means up to about 60 extra queries per page. | Add `options(joinedload(account), joinedload(destination_account), joinedload(category))` to the list, get-by-id, recent-transactions and CSV export queries. |
| P3 | High | `services/analytics_service.py` | Monthly trend runs 12 queries (income and expense for each of 6 months). | One query over the 6-month range, grouped by year, month and type. Fill missing months with 0. Keep the response shape. |
| P4 | Med | `services/analytics_service.py` | One `Category` query per spending row. | Fetch all needed categories with one `IN` query, or join in the grouped query. |
| P5 | Med | `services/budget_service.py` `get_budgets` | One spent-query plus a lazy category load per budget. | One grouped spent-query by `category_id` for the month. `joinedload(Budget.category)`. |
| P6 | Med | `main.py`, `api/v1/auth.py` | `create_all` plus a 15-query category seed on every boot. `register` re-seeds on every signup. | Remove the seed from `register`. In lifespan, seed only if `count(system categories) == 0`. Run `create_all` only when env `AUTO_CREATE_TABLES` is true (default true). |
| P7 | Med | `db/session.py` | No pool settings. | For non-SQLite use `pool_size=5, max_overflow=5, pool_recycle=300`. Keep `pool_pre_ping`. Note in `.env.example`: use Neon's **pooled** connection string. |
| P8 | Low | `models/transaction.py` | The common filter `(user_id, type, occurred_at)` has no index. | Add `Index("ix_tx_user_type_occurred", "user_id", "type", "occurred_at")`. |
| P9 | Med | `requirements.txt` | `pandas`, `openpyxl` and `alembic` are unused. Test packages are installed in production. This slows builds and uses memory on the 512 MB free tier. | Remove the three unused packages. Move `pytest`, `pytest-asyncio` and `httpx` to `requirements-dev.txt`. |

## Phase 3. Bugs (B)

| ID | Sev | File | Problem | Fix |
|---|---|---|---|---|
| B1 | Med | `api/v1/analytics.py`, `api/v1/budgets.py` | `month` is not validated. `"abc"` or `"2026-13"` causes a 500. | `Query(pattern=r"^\d{4}-(0[1-9]\|1[0-2])$")`. Invalid values return 422. |
| B2 | Med | `services/transaction_service.py`, `api/v1/transactions.py` | `sort_by` goes straight into `getattr(Transaction, ...)`. A bad value returns 500 or sorts on a relationship. | Allowlist `occurred_at, amount, created_at, description`. Otherwise 422. |
| B3 | High | `schemas/transaction.py`, `services/transaction_service.py` | Timezone bug. The frontend sends UTC (`toISOString`). The DB column is naive, so it is stored as UTC and returned without a `Z`. `parseISO` then treats it as local time, so times shift by the user's UTC offset (about 5.5 h in IST). **Verify** by adding a transaction at a known time. | On input, convert aware datetimes to naive UTC. On output (`TransactionOut`), serialize `occurred_at` as UTC with `Z`. No migration needed. Document that month boundaries are UTC. |
| B4 | Med | `services/analytics_service.py`, `services/transaction_service.py` | Multi-currency is mishandled. The dashboard sums balances of different currencies and labels the total with the first account's currency. The transaction `currency` is client-supplied and may not match the account. Transfers between currencies are treated as 1:1. | On create/update, force `currency` to the source account's currency. Reject transfers between accounts with different currencies (400). The dashboard sums only accounts in `user.currency_code` and returns that code. |
| B5 | Med | `services/transaction_service.py` `_validate_references` | Editing any field of a transaction on an archived account (or with an archived category) is blocked, even if that account or category is unchanged. | Run the archived checks only for ids that are actually changing. |
| B6 | Low | `services/transaction_service.py`, `services/category_service.py` | `ilike` with unescaped `%` and `_` from user input. | Escape `\`, `%` and `_`, and use `ilike(pattern, escape="\\")`. |
| B7 | **High** | `frontend/src/context/AuthContext.tsx` | `getMe()` failure of **any** kind (network error, 502, timeout while Render wakes up) clears the session and logs the user out. | Clear the session only when `error.response?.status === 401`. Otherwise keep the stored token and user, set `isLoading=false`, and let the page retry. |
| B8 | **High** | `frontend/src/api/client.ts`, `frontend/src/main.tsx` | No request timeout, no retry on a sleeping backend, no feedback. | Axios `timeout: 60000`. Query `retry: 3` with exponential delay for network, timeout and 5xx errors only. Show a banner "Server is waking up, this can take up to a minute" when a request is pending for more than 4 s (also on Login/Register submit). |
| B9 | Low | `api/deps.py`, `api/v1/auth.py` | The Swagger "Authorize" button fails. `tokenUrl` points to `/auth/login`, which expects JSON, not form data. | Add `POST /auth/token` (OAuth2 form) that returns the same token and point `tokenUrl` there. Keep `/auth/login`. |
| B10 | Low | `frontend/src/utils/formatters.ts` | The fallback returns `$0.00` or `$x` and ignores the currency. The locale is fixed to `en-US`. | Fallback uses the `currency` argument. Use `en-IN` locale when currency is `INR`. |

## Phase 4. Deploy & hygiene (D)

| ID | Sev | File | Problem | Fix |
|---|---|---|---|---|
| D1 | High | `frontend/vercel.json` (new) | There is no SPA rewrite, so refreshing `/transactions` or `/budgets` on Vercel probably returns 404. | Add `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`. |
| D2 | Med | `backend/.env.example`, `frontend/.env.example` (new), `README.md` | Env vars are undocumented. `VITE_API_URL` defaults to `/api/v1`, which hits Vercel itself, not the backend. | Add both examples (`DATABASE_URL`, `SECRET_KEY`, `BACKEND_CORS_ORIGINS`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `AUTO_CREATE_TABLES`, `VITE_API_URL`). Add a "Deploy" section to the README (Vercel, Render, Neon). |
| D3 | High | `main.py` | `/health` does not touch the DB, so a keep-alive ping will not wake Neon. | Keep `/health` as is. Add `GET /health/db` that runs `SELECT 1` and returns 200 or 503. **Manual:** cron-job.org pings `/health/db` every 10 min. |
| D4 | Low | `README.md`, `How_It_Works.md` | The docs say PyJWT (code used jose) and "in-memory test DB" (it is a file `test_expense_tracker.db`). The README implies a `.venv` is committed. | Update the docs to match the code after S5. |
| D6 | Low | `core/config.py`, `schemas/*` | Pydantic v1-style `class Config` is deprecated in v2. | Use `model_config = ConfigDict(...)` / `SettingsConfigDict(...)`. |
| D7 | Low | `backend/runtime.txt` | Render may not read `runtime.txt` (it is a Heroku convention). **Verify** in the Render docs. | If needed, set the `PYTHON_VERSION` env var on Render or add `.python-version`. |

---