const PORT = 3000

const DOM_CAPTION_KR = document.getElementById("caption_kr")
const DOM_CAPTION_JP = document.getElementById("caption_jp")
const DOM_CAPTION_EN = document.getElementById("caption_en")

const TRANS_URL = "https://translation.googleapis.com/language/translate/v2?key=AIzaSyC4ggpoEIQkakNKows9j8M51BVIPYjSeb8"
const TRANS_HEADERS = {
    "Authorization": "AIzaSyC4ggpoEIQkakNKows9j8M51BVIPYjSeb8",
    "Content-Type": "application/json; charset=utf-8",
}
//여기서 부터는 음성인식에 관한 코딩입니다.

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
const recognition = new SpeechRecognition()
const socket = new WebSocket(`ws:localhost:${PORT}`)

function message(fin_text, interim, isfinal)
{
    let displayText = `${username.value}: ${fin_text || interim}`
    DOM_CAPTION_KR.innerHTML = displayText

    if (isfinal)
    {
        socket.send(JSON.stringify({
            "kr": fin_text,
            "username": username.value
        }))

        let jp_translated = "";
        let en_translated = "";

        fetch(TRANS_URL, {
            method: "POST",
            mode: "cors",
            headers: TRANS_HEADERS,
            body: JSON.stringify({
                "q": fin_text,
                "target": "ja"
            })
        }).then((res) => res.json()).then((data) => {
            jp_translated = data["data"]["translations"][0]["translatedText"]
            DOM_CAPTION_JP.innerHTML = jp_translated

            socket.send(JSON.stringify({
                "jp": fin_text,
                "username": username.value
            }))
        })

        fetch(TRANS_URL, {
            method: "POST",
            mode: "cors",
            headers: TRANS_HEADERS,
            body: JSON.stringify({
                "q": fin_text,
                "target": "de"
            })
        }).then((res) => res.json()).then((data) => {
            en_translated = data["data"]["translations"][0]["translatedText"]
            DOM_CAPTION_EN.innerHTML = en_translated

            socket.send(JSON.stringify({
                "en": en_translated,
                "username": username.value
            }))
        })
    }
    else
    {
        socket.send(JSON.stringify({
            "kr": interim,
            "username": username.value
        }))
    }
}

function onend(e) { recognition.start() }
function onresult(e)
{
    let fin_text = ""
    let interim = ""
    let isfinal = false
    for (let i = 0; i < e.results.length; i++)
    {
        let res = e.results[i]
        let trans = res[0].transcript
        if (res.isFinal) 
        {
            fin_text += trans
            isfinal = true
        }
        else
        {
            interim += trans
        }
    }

    message(fin_text.trim(), interim.trim(), isfinal)
}

recognition.lang = "de"
recognition.continuous = false
recognition.interimResults = true
recognition.maxAlternatives = 10000
recognition.onresult = onresult
recognition.onend = onend
recognition.start()