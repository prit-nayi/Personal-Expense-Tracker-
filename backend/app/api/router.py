from fastapi import APIRouter
from app.api.v1 import auth, accounts, categories, transactions, budgets, analytics, exports

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(accounts.router)
api_router.include_router(categories.router)
api_router.include_router(transactions.router)
api_router.include_router(budgets.router)
api_router.include_router(analytics.router)
api_router.include_router(exports.router)
