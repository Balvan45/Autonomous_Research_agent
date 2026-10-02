from pyexpat.errors import messages
from typing import TypedDict, Annotated,Literal
from langchain_groq import ChatGroq


from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage,SystemMessage
from langchain_core.prompts import ChatMessagePromptTemplate, ChatPromptTemplate

from langchain_core.messages import BaseMessage
from langchain_ollama import ChatOllama

#from langchain_community.vectorstores import FAISS
#from langchain_text_splitter import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph,START,END
#from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from typing import TypedDict,List,Annotated,Literal
from pydantic import BaseModel,Field
import operator
from langchain_core.messages import HumanMessage,SystemMessage,AIMessage,BaseMessage
from langgraph.checkpoint.memory import InMemorySaver

from langgraph.prebuilt import ToolNode,tools_condition
from langchain_core.tools import tool
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_ollama import ChatOllama

from langchain_community.document_loaders import PyPDFLoader

import requests
import random

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langchain_groq import ChatGroq
import sqlite3
import os
from dotenv import load_dotenv
from langchain.agents import create_agent

load_dotenv()

os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
os.environ["TAVILY_API_KEY"] = os.getenv("TAVILY_API_KEY")



model = ChatGroq(
    model="openai/gpt-oss-20b",      # Fast & cheap (recommended)
    # model="openai/gpt-oss-120b",   # Stronger alternative
    # model="qwen/qwen3.6-27b",      # Another good option
    temperature=0,
)

agent = create_agent(
    model=model,
    tools=[
        DuckDuckGoSearchRun()
    ]

)

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

##########################################################################################

async def chat_node(state: ChatState):
    final_messages = None

    async for event in agent.astream(
        {"messages": state["messages"]},
        stream_mode="values"          # important
    ):
        final_messages = event["messages"]

    return {"messages": final_messages}



def build_graph():
    graph = StateGraph(ChatState)

    graph.add_node(
        "chat_node",
        chat_node
    )

    graph.add_edge(
        START,
        "chat_node"
    )


    graph.add_edge("chat_node", END)
    return graph



__all__ = ["build_graph", "agent", "ChatState"]







"""def retrieve_all_threads():

    all_threads = set()

    for checkpoint in checkpointer.list(None):

        thread_id = checkpoint.config[
            "configurable"
        ].get("thread_id")

        if thread_id:
            all_threads.add(thread_id)

    return list(all_threads)

if __name__ == "__main__":
    CONFIG = {
        "configurable": {
            "thread_id": "01"
        }
    }

    result = workflow.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Explain RAG"
                }
            ]
        },
        config=CONFIG
    )

    print("\n================================")
    print("FINAL ANSWER")
    print("================================\n")

    print(result["messages"][-1].content)"""