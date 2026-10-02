from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import json



from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from apps.agent.rag_agent import build_graph,agent



POSTGRES_URI = ( "postgresql://postgres:postgres@localhost:5432/research_agent" )

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting PostGreSQL checkpointer")

    async with AsyncPostgresSaver.from_conn_string( POSTGRES_URI ) as checkpointer:
        await checkpointer.setup()

        print("PostgreSQL is Ready")

        graph = build_graph()

        app.state.workflow = graph.compile(checkpointer=checkpointer)

        print("Langraph workflow is Ready")

        yield

        print("shutting down...")
        

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/")
async def root():
    return {"status": "FastAPI is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(request: ChatRequest):

    async def generate():
        print("REQUEST RECEIVED:", request.message)

        # Force streaming from the model
        full_response = ""

        async for event in agent.astream_events(
            {
                "messages": [
                    {"role": "user", "content": request.message}
                ]
            },
            version="v2",
            stream_mode="messages"           # try this
        ):
            print("EVENT:", event)

        # Fallback: just get the final answer (this will always work)
        result = await agent.ainvoke(
            {
                "messages": [
                    {"role": "user", "content": request.message}
                ]
            }
        )

        final_message = result["messages"][-1]
        content = final_message.content

        print("FINAL ANSWER:", content)
        yield content

    return StreamingResponse(
        generate(),
        media_type= "text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )