import json
import httpx
import asyncio
from datetime import datetime
from typing import Dict, Any

class AgentRunner:
    def __init__(self, session_id: str):
        self.session_id = session_id
        # Ollama 기본 API 주소 (Docker 사용 시 localhost 대신 host.docker.internal 등 확인 필요)
        self.ollama_url = "http://localhost:11434/api/generate" 

    async def run_agent(self, agent_id: str, agent_data: Dict[str, Any], obs: Dict[str, Any], condition: str) -> Dict[str, Any]:
        role = agent_data.get('role', 'analyst')
        print(f"\n[DEBUG] 🤖 {agent_id}({role}) 보고서 생성 시작...")
        
        # 프롬프트 구성
        prompt = f"""당신은 {role} 전문가입니다. 
현재 상황: {json.dumps(obs, ensure_ascii=False)}
위 데이터를 분석하여 반드시 JSON 형식으로만 답하세요. 
형식: {{"summary": "요약", "reason": "이유", "confidence": 0.9, "recommended_action": "install/discard/stay", "uncertainties": []}}"""

        try:
            # 1. Ollama 호출 시작 로그
            print(f"[DEBUG] 📡 Ollama API 호출 중... ({self.ollama_url})")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.ollama_url, json={
                    "model": "qwen2.5-coder:3b",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                })
                
                # 2. HTTP 상태 코드 확인
                if response.status_code != 200:
                    print(f"[ERROR] ❌ Ollama 호출 실패: 상태 코드 {response.status_code}")
                    return self._generate_fallback(agent_id, agent_data, obs, "API 연결 실패")

                result = response.json()
                raw_response = result.get('response', '')
                print(f"[DEBUG] 📥 Ollama 응답 수신 완료.")

                # 3. JSON 파싱
                report_content = json.loads(raw_response)
                
        except httpx.ConnectError:
            print(f"[ERROR] ❌ Ollama 서버에 접속할 수 없습니다. Ollama가 켜져 있는지 확인하세요.")
            return self._generate_fallback(agent_id, agent_data, obs, "Ollama 서버 미가동")
        except json.JSONDecodeError:
            print(f"[ERROR] ❌ JSON 파싱 실패. 응답 내용: {raw_response[:100]}...")
            return self._generate_fallback(agent_id, agent_data, obs, "JSON 형식 오류")
        except Exception as e:
            print(f"[ERROR] ❌ 예상치 못한 오류 발생: {str(e)}")
            return self._generate_fallback(agent_id, agent_data, obs, str(e))

        # 4. 정상 리턴
        print(f"[DEBUG] ✅ {agent_id} 보고서 생성 성공.")
        return {
            "reportId": f"rep_{datetime.now().timestamp()}_{agent_id}",
            "agentId": agent_id,
            "agentName": agent_data.get('name', agent_id),
            "role": role,
            "turn": obs.get('turn', 0),
            "content": f"{report_content.get('summary', '')}\n{report_content.get('reason', '')}",
            "confidence": report_content.get("confidence", 0.8), 
            "suggestedAction": report_content.get("recommended_action", "stay"),
            "uncertainties": report_content.get("uncertainties", []),
            "isFollowupResponse": False,
            "timestamp": datetime.now().isoformat()
        }

    def _generate_fallback(self, agent_id, agent_data, obs, error_msg):
        """오류 발생 시 게임이 멈추지 않도록 기본 답변을 생성합니다."""
        return {
            "reportId": f"error_{datetime.now().timestamp()}",
            "agentId": agent_id,
            "agentName": agent_data.get('name', agent_id),
            "role": agent_data.get('role', 'analyst'),
            "turn": obs.get('turn', 0),
            "content": f"시스템 오류로 보고서를 생성할 수 없습니다. (사유: {error_msg})",
            "confidence": 0,
            "suggestedAction": "stay",
            "uncertainties": [error_msg],
            "isFollowupResponse": False,
            "timestamp": datetime.now().isoformat()
        }