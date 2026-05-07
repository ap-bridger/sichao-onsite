from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from fastapi import FastAPI
from pydantic import BaseModel

model = ChatAnthropic(model="claude-haiku-4-5-20251001")
tools = []
graph = create_react_agent(model, tools)

app = FastAPI()

class Request(BaseModel):
    username: str

@app.post("/agent")
async def agent(request: Request):
    prompt = f"Hello my name is {request.username}. Greet me by my name please, and try to mix things up"
    result = graph.invoke({"messages": [HumanMessage(prompt)]})
    response = result["messages"][-1]
    return response.content