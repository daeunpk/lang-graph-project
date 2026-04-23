import json
from datetime import datetime
from typing import Dict, Any
from app.agents.memory import agent_memory_store
from app.agents.prompts import SYSTEM_BASE_PROMPT, ROLE_DESCRIPTIONS, CONDITION_CONTEXTS
from app.agents.agent_policy import AgentPolicy

class AgentRunner:
    def __init__(self, session_id: str):
        self.session_id = session_id

    async def run_agent(self, agent_id: str, agent_data: Dict[str, Any], obs: Dict[str, Any], condition: str) -> Dict[str, Any]:
        memory = agent_memory_store.get_memory(self.session_id, agent_id)
        role = agent_data['role']
        
        # 1. 프롬프트 조립
        prompt = SYSTEM_BASE_PROMPT.format(
            role_description=ROLE_DESCRIPTIONS[role],
            condition_context=CONDITION_CONTEXTS[condition],
            memory_context=str(memory.model_dump()),
            observation_context=json.dumps(obs)
        )
        
        # 2. LLM 호출 (여기서는 Fallback으로 실제 로직 대체)
        # 실제 구현 시: response = await openai_client.chat(...)
        report_content = AgentPolicy.generate_fallback_report(role, condition, obs)
        
        # 3. 기억 업데이트
        memory.last_reports.append({
            "turn": obs.get('turn', 0),
            "content": report_content,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "reportId": f"rep_{datetime.now().timestamp()}_{agent_id}",
            "agentId": agent_id,
            "agentName": agent_data['name'],
            "role": role,
            "turn": obs.get('turn', 0),
            "content": report_content["summary"] + "\n" + report_content["reason"],
            "confidence": report_content["confidence"],
            "suggestedAction": report_content["recommended_action"],
            "uncertainties": report_content["uncertainties"],
            "isFollowupResponse": False,
            "timestamp": datetime.now().isoformat()
        }