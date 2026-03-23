// 遊戲狀態與收集到的知識
let inventory = [];
let currentState = 'start';
let typewriterTimeout = null;
let soundEnabled = true;

// 新增優化變數
let errorsCount = 0;
let isTyping = false;
let fullFormattedText = '';
let ambientOsc1 = null;
let ambientOsc2 = null;
let ambientGain = null;
let isBgmPlaying = false;

// Web Audio API Sound Synthesizer (保持不變)
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playBGM() {
    if (!audioCtx) initAudio();
    if (ambientOsc1) return;

    ambientOsc1 = audioCtx.createOscillator();
    ambientOsc2 = audioCtx.createOscillator();
    ambientOsc1.type = 'sine';
    ambientOsc2.type = 'triangle';
    
    ambientGain = audioCtx.createGain();
    
    ambientOsc1.connect(ambientGain);
    ambientOsc2.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    
    ambientOsc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 低音
    ambientOsc2.frequency.setValueAtTime(111.5, audioCtx.currentTime); // 微微走音營造科技/懸疑感
    
    ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 2); // 淡入
    
    ambientOsc1.start();
    ambientOsc2.start();
    isBgmPlaying = true;
}

function stopBGM() {
    if (ambientOsc1 && audioCtx) {
        const now = audioCtx.currentTime;
        ambientGain.gain.linearRampToValueAtTime(0, now + 1); // 淡出
        ambientOsc1.stop(now + 1);
        ambientOsc2.stop(now + 1);
        setTimeout(() => {
            ambientOsc1 = null;
            ambientOsc2 = null;
        }, 1000);
    }
    isBgmPlaying = false;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    const icon = document.getElementById('sound-icon');
    if(soundEnabled) {
        btn.classList.remove('muted');
        icon.className = 'fa-solid fa-volume-high';
        playSound('click');
        if (currentState !== 'start' && !isBgmPlaying) {
            playBGM();
        }
    } else {
        btn.classList.add('muted');
        icon.className = 'fa-solid fa-volume-xmark';
        stopBGM();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 'click':
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1); break;
        case 'error':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3); break;
        case 'success':
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start(now); osc.stop(now + 0.4); break;
        case 'item':
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3); break;
    }
}

// Particle Effect System (保持不變)
function createParticles(x, y, color) {
    const container = document.getElementById('particles-container');
    for(let i=0; i<15; i++) {
        const p = document.createElement('div'); p.className = 'particle';
        p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.backgroundColor = color;
        p.style.width = Math.random() * 8 + 4 + 'px'; p.style.height = p.style.width;
        const tx = (Math.random() - 0.5) * 100; p.style.transform = `translate(${tx}px, 0)`;
        container.appendChild(p);
        setTimeout(() => p.remove(), 1500);
    }
}

// --- 劇本擴充至 12 個關卡 ---
const scenarios = {
    start: {
        chapter: "第零章：單打獨鬥的困境",
        speaker: "老闆 趙董事長",
        role: "慣老闆的日常",
        avatar: "fa-user-ninja",
        text: "最近物價上漲，公司不僅沒加薪，還要你們共體時艱！不滿意的話門在那邊，隨時可以走人，反正外面排隊想進來的人多的是！",
        hint: "一個人的力量太小了，我們需要團結起來！",
        options: [
            { text: "找同事們一起討論：「我們應該組工會來跟老闆談判！」", next: "c1_union_init", type: "good",
              knowledge: "團結權的真諦：勞工有權組織與參加工會，透過集體的力與雇主進行平等的協商，這是勞動基準的起點。" },
            { text: "摸摸鼻子算了，反正薪水還過得去。", next: "c0_scam_fail", type: "bad" },
            { text: "寄發存證信函給老闆，要求他履行勞檢員的加薪建議。", next: "c0_scam_fail", type: "bad" }
        ],
        progress: 5
    },
    c0_scam_fail: {
        speaker: "勞工前輩", role: "過來人", avatar: "fa-user-group",
        text: "【大危機】單打獨鬥去跟老闆爭取，或消極忍耐都無法改變現狀！記住，團結力量大，你需要找到志同道合的夥伴！",
        options: [{ text: "重新思考策略！", next: "start" }], progress: 5
    },
    
    c1_union_init: {
        chapter: "第一章：籌組工會",
        speaker: "同事 小美", role: "顧慮重重的會計", avatar: "fa-calculator",
        text: "組工會是不錯啦... 可是我們公司規模這麼小，全部加起來才 20 個人，法律規定要 30 人才能發起企業工會，這下不能組了吧？",
        hint: "工會不一定要以「公司」為單位喔！",
        options: [
            { text: "那就先成立「職工福利委員會」，反正層級差不多？", next: "c1_union_fail", type: "bad" },
            { text: "靈機一動：『我們還可以加入跨公司的「產業工會」或「職業工會」！』", next: "c2_ulp_init", type: "good",
              knowledge: "工會類型：除企業工會(滿30人可籌組)外，勞工亦可加入跨廠場的「產業工會」或具備同種技能的「職業工會」。" },
            { text: "只好放棄了，人數不夠也是法律明文規定的硬傷。", next: "c1_union_fail", type: "bad" }
        ],
        progress: 15
    },
    c1_union_fail: {
        speaker: "勞動法寶典", role: "知識補充", avatar: "fa-book-skull",
        text: "【失敗】你太容易被技術細節卡住了！「職工福利委員會」是資方主導的，不是真正的工會。勞工可以跨越公司藩籬，尋求產業工會或職業工會的支持！",
        options: [{ text: "想想其他形式的工會。", next: "c1_union_init" }], progress: 15
    },

    c2_ulp_init: {
        chapter: "第二章：殺雞儆猴",
        speaker: "老闆 趙董事長", role: "秋後算帳", avatar: "fa-face-angry",
        text: "（把帶頭的你叫進辦公室）聽說你在公司鼓吹大家參加工會？破壞公司和諧！你這種破壞份子，我現在就以「不能勝任工作」將你解僱！",
        hint: "雇主不能因為勞工參加工會就處罰勞工！",
        options: [
            { text: "強忍淚水：「老闆，只要我不組工會，您可以讓我復職嗎？」", next: "c2_ulp_fail", type: "bad" },
            { text: "冷笑回應：『你這是「不當勞動行為」，解僱無效，我會申請裁決！』", next: "c3_bargain_init", type: "good",
              knowledge: "不當勞動行為：雇主禁止或妨礙勞工組織、參加工會，或以此為由解僱、降調，即構成不當勞動行為，依法無效且將面臨重罰。" },
            { text: "老闆好可怕，既然大家都怕他，我還是先低調保住飯碗吧...", next: "c2_ulp_fail", type: "bad" }
        ],
        progress: 25
    },
    c2_ulp_fail: {
        speaker: "工會幹部", role: "後盾支援", avatar: "fa-shield-halved",
        text: "【損失權益】你被老闆唬住了！屈服或忍耐只會讓老闆變本加厲。工會法第35條保障了勞工，這種報復性解僱在勞動部裁決中絕對是無效的！",
        options: [{ text: "勇敢面對老闆的威脅。", next: "c2_ulp_init" }], progress: 25
    },

    c3_bargain_init: {
        chapter: "第三章：搭便車的人",
        speaker: "老闆 趙董事長", role: "資源分配", avatar: "fa-coins",
        text: "好，算你們厲害，工會成立了。你們要求「每年加發三天旅遊假」，我可以答應，但為了公平，全公司不分有沒有參加工會，通通都有這項福利！",
        hint: "如果沒繳會費的人也能享受努力爭取來的成果，誰還要加工會？",
        options: [
            { text: "堅決反對：『應加入「禁搭便車條款」，這項福利只限工會會員！』", next: "c4_faith_init", type: "good",
              knowledge: "禁搭便車條款：為鼓勵加入工會，團體協約可明定雇主非經工會同意，不得將爭取來的福利適用於非會員(搭便車者)。" },
            { text: "老闆真佛心，大家都有福利最好了，這樣大家會更支持工會！", next: "c3_bargain_fail", type: "bad" },
            { text: "跟老闆建議：「那我們把會費提高，補償這次爭取福利的辛苦吧！」", next: "c3_bargain_fail", type: "bad" }
        ],
        progress: 35
    },
    c3_bargain_fail: {
        speaker: "資深會員", role: "工會視視角", avatar: "fa-users-slash",
        text: "【嚴重吃虧】你上當了！如果沒繳會費的人也能免費享受成果，大家都會退出工會(搭便車)，工會最後就會瓦解！提高會費只會讓會員跑更快。",
        options: [{ text: "保障會員專屬權益。", next: "c3_bargain_init" }], progress: 35
    },

    c4_faith_init: {
        chapter: "第四章：敷衍了事",
        speaker: "人事經理", role: "資方代表", avatar: "fa-user-clock",
        text: "關於你們要在團體協約裡增加「本薪調漲5%」的提案... 唉呀，老闆最近很忙，而且公司機密財報不方便給你們看，我們明年再來談吧！",
        hint: "拒絕協商、拖延戰術、隱瞞關鍵資料，這些都是違法的協商態度！",
        options: [
            { text: "公司既然有困難，那我們立刻發起罷工，讓老闆知道厲害！", next: "c4_faith_fail", type: "bad" },
            { text: "公司既然真的有困難，那我們明年再來談看看好了...", next: "c4_faith_fail", type: "bad" },
            { text: "拍桌警告：『這已違反雇主的「誠信協商義務」！請提出對案！』", next: "c5_dispute_init", type: "good",
              knowledge: "誠信協商義務：勞資進行團體協商時，雇主不得無故拒絕、拖延，且必須提供必要之資料並提出對案，否則構成不當勞動行為。" }
        ],
        progress: 45
    },
    c4_faith_fail: {
        speaker: "協商專家", role: "戰略指導", avatar: "fa-comments-dollar",
        text: "【錯失良機】資方這是在使用拖延戰術！法令規定雇主有誠信協商義務，不能拿機密當擋箭牌。但注意，罷工要先經過調解，現在罷工是違法的喔！",
        options: [{ text: "展現強硬的談判姿態。", next: "c4_faith_init" }], progress: 45
    },

    c5_dispute_init: {
        chapter: "第五章：抗爭的理由",
        speaker: "熱血新進同事", role: "衝動派", avatar: "fa-fire",
        text: "老闆實在太惡劣了，連上個月的『加班費』都故意算錯少發給我們！大家不要談了，我們明天拉布條，為了要回這筆加班費來罷工！",
        hint: "罷工可不是隨便什麼原因都能發起的，要注意「事項」分類！",
        options: [
            { text: "說得對！欠債還錢，這就是勞動權益，罷工討回公道！", next: "c5_dispute_fail", type: "bad" },
            { text: "踩剎車：『積欠加班費屬於「權利事項」，依法不能罷工！應透過訴訟解決。』", next: "c6_mediate_init", type: "good",
              knowledge: "爭議分類：勞資爭議分「權利事項」(依法本就該給的權利，不能罷工)與「調整事項」(維持或變更未來的勞動條件，可以罷工)。" },
            { text: "考慮一下：「罷工太累了，我們直接去法院控告老闆偽造文書比較快。」", next: "c5_dispute_fail", type: "bad" }
        ],
        progress: 55
    },
    c5_dispute_fail: {
        speaker: "法務律師", role: "法規顧問", avatar: "fa-scale-balanced",
        text: "【違法罷工】為「權利事項」(既有權利受損)罷工是違法的！這類爭議請直接申訴或提起訴訟。偽造文書雖然嚴重，但解決不了少發薪水的問題。只有「調整事項」(加薪、休假)才能罷工！",
        options: [{ text: "導正同事的法律觀念。", next: "c5_dispute_init" }], progress: 55
    },

    c6_mediate_init: {
        chapter: "第六章：關鍵程序",
        speaker: "工會理事長", role: "團隊領袖", avatar: "fa-user-astronaut",
        text: "好，理清了！我們的目標是爭取『全面調薪 10%』(調整事項)。既然老闆死都不點頭，那我們接下來該怎麼做才能合法發動罷工？",
        hint: "因為罷工殺傷力太大，法律規定必須先有一個「冷靜期」機制...",
        options: [
            { text: "翻開法條：『罷工前必須先向主管機關申請「調解」，調解不成立才能進行下一步！』", next: "c7_vote_init", type: "good",
              knowledge: "調解先行原則：罷工影響重大，為避免社會輕易動盪，勞資爭議處理法明定罷工必須先經過官方「調解程序」，調解不成立方能發動罷工。" },
            { text: "直接跳過調解，直接發動會員大會投票，爭取時效！", next: "c6_mediate_fail", type: "bad" },
            { text: "立刻發布新聞稿，明天包圍老闆辦公室，以聲勢逼老闆就範！", next: "c6_mediate_fail", type: "bad" }
        ],
        progress: 65
    },
    c6_mediate_fail: {
        speaker: "勞動局官員", role: "程序把關者", avatar: "fa-stamp",
        text: "【程序錯誤】太衝動了！沒有經過調解程序直接罷工(或投票)，會被認定為非法。參與者將不受免責保護，甚至可能被解僱或沒收薪資！",
        options: [{ text: "遵守法定的爭議處理程序。", next: "c6_mediate_init" }], progress: 65
    },

    c7_vote_init: {
        chapter: "第七章：民主的展現",
        speaker: "工會理事長", role: "團隊領袖", avatar: "fa-clipboard-check",
        text: "勞工局的調解正式宣告『不成立』！老闆根本無意加薪。我是理事長，為了大家權益，我現在直接宣布：全體會員明天起開始罷工！",
        hint: "罷工是會讓員工領不到薪水且承擔風險的重大決議，不能只由少數人決定！",
        options: [
            { text: "理事長英明！我們聽你的政策，團結一致！", next: "c7_vote_fail", type: "bad" },
            { text: "等等！『經理事會開會決定後，就能直接報備勞資雙方開始罷工！』", next: "c7_vote_fail", type: "bad" },
            { text: "等等！『宣告罷工必須經工會全體會員「無記名投票」且過半數同意才可以！』", next: "c8_strike_init", type: "good",
              knowledge: "罷工投票要件：罷工事關重大，工會法規定必須經由內部民主程序，也就是「全體會員無記名投票且經全體過半數同意」，始得宣告罷工。" }
        ],
        progress: 75
    },
    c7_vote_fail: {
        speaker: "法院判決書", role: "血淚教訓", avatar: "fa-gavel",
        text: "【越權行為】理事長或理事會都無權單方面宣布罷工！缺乏會員大會「無記名投票」且「過半同意」的罷工，會失去正當性，甚至可能面臨刑事處罰！",
        options: [{ text: "確保罷工具有民主正當性。", next: "c7_vote_init" }], progress: 75
    },

    c8_strike_init: {
        chapter: "第八章：街霸的防線",
        speaker: "老闆 趙董事長", role: "暴怒的資方", avatar: "fa-poo-storm",
        text: "（罷工第一天）你們太誇張了！居然在公司門口拉糾察線，還舉牌勸其他員工跟貨運司機不要進去！這嚴重影響我的營業，我要告你們強制罪！",
        hint: "罷工必定會影響運作，只要過程保持非暴力，資方是不能隨便告人的。",
        options: [
            { text: "拉起布條：『我們設置的是合法的「罷工糾察線」，雇主無權因此懲戒或提告！』", next: "c9_success_init", type: "good",
              knowledge: "罷工糾察線(Picket Line)：工會於合法罷工時，得於營業處所設置糾察線以和平方式勸導他人支持。資方不得對合法罷工行為要求民事賠償或刑事提告。" },
            { text: "老闆看起來要來真的(告強制罪)，我們先撤退，改成在公園靜坐好了...", next: "c8_strike_fail", type: "bad" },
            { text: "回嗆：「這是私人土地，我們想做什麼就做什麼，你管不著！」", next: "c8_strike_fail", type: "bad" }
        ],
        progress: 85
    },
    c8_strike_fail: {
        speaker: "國際勞工組織", role: "聲援者", avatar: "fa-globe",
        text: "【被道德綁架】撤退就輸了！靜坐無法達成壓迫效果。只要不使用暴力，設置糾察線是合法的爭議行為。但注意，「私人土地」不能作為法律理由。不要被嚇跑！",
        options: [{ text: "堅守罷工糾察線。", next: "c8_strike_init" }], progress: 85
    },

    c9_success_init: {
        chapter: "第九章：勝利的果實",
        speaker: "老闆 趙董事長", role: "妥協的資方", avatar: "fa-handshake-simple",
        text: "（罷工第三天）產線停擺損失太慘重了... 好啦好啦，我服了！我口頭承諾答應你們加薪，請大家明天趕快回來上班！",
        hint: "口說無憑，千萬不要被老闆的花言巧語騙了！",
        options: [
            { text: "等老闆發送全公司正式 Email 公告後，我們就立刻復工！", next: "c9_success_fail", type: "bad" },
            { text: "太棒了！大家明天趕快復工，把這幾天沒領到的薪水賺回來！", next: "c9_success_fail", type: "bad" },
            { text: "拿出紙筆：『請立刻與我們簽訂「團體協約」，白紙黑字才算數！』", next: "c10_success", type: "good",
              knowledge: "團體協約效力：罷工的終點是簽下「團體協約」。它具有規範效力，位階高於個人勞動契約。有了這張護身符，老闆就無法輕易反悔！" }
        ],
        progress: 95
    },
    c9_success_fail: {
        speaker: "街頭工運老兵", role: "工運歷史", avatar: "fa-person-cane",
        text: "【功虧一簣】太天真了！Email 或口頭承諾都不具備規範效力。老闆如果事後反悔，你這次罷工就白費了！一定要將承諾落實為正式的「團體協約」！",
        options: [{ text: "要求簽訂正式的團體協約。", next: "c9_success_init" }], progress: 95
    },

    c10_success: {
        chapter: "通關：勞動權益大師！",
        speaker: "全台工會大聯盟", role: "最高榮譽", avatar: "fa-medal",
        text: "太不可思議了！你成功帶領夥伴透過「團結組織」、「誠信協商」、「爭議行動」三部曲，為勞工爭取到尊嚴與權益！團結力量大，願你未來的職場生涯無所畏懼！",
        hint: "太棒了！你已經具備集體勞資關係與工會運作的完整知識！",
        options: [
            { text: "重新遊玩，鞏固知識", next: "start", type: "good" }
        ],
        progress: 100
    }
};

// UI 更新函數
function updateInventoryUI() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    if (inventory.length === 0) {
        list.innerHTML = `
            <li style="color: var(--text-muted); border-left: none; text-align: center; background: none; font-style: italic;">
                <i class="fa-solid fa-hourglass-start" style="margin-bottom: 5px; display: block; font-size: 1.5em; opacity: 0.5;"></i>
                尚未獲得知識...
            </li>`;
    } else {
        inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong><i class="fa-solid fa-scroll" style="color:var(--primary);"></i> 知識 ${index+1}：</strong><br>${item}`;
            list.appendChild(li);
        });
        // Scroll to top of inventory
        const invDiv = document.getElementById('knowledge-inventory');
        invDiv.scrollTop = 0;
    }
}

// --- 進度儲存與讀取 ---
function saveProgress() {
    const data = { currentState, inventory, errorsCount };
    localStorage.setItem('laborRightsSave', JSON.stringify(data));
}
function loadProgress() {
    const data = localStorage.getItem('laborRightsSave');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            currentState = parsed.currentState || 'start';
            inventory = parsed.inventory || [];
            errorsCount = parsed.errorsCount || 0;
        } catch(e) {}
    }
}
function resetProgress() {
    if(confirm('確定要清除所有進度並重新開始嗎？')) {
        localStorage.removeItem('laborRightsSave');
        currentState = 'start';
        inventory = [];
        errorsCount = 0;
        updateUI();
    }
}

function typeWriter(text, element, speed = 25) {
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    let currentHTML = '';
    let i = 0;
    isTyping = true;
    fullFormattedText = text;
    
    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '<') {
                while (i < text.length && text.charAt(i) !== '>') {
                    currentHTML += text.charAt(i);
                    i++;
                }
                currentHTML += '>';
                i++;
            } else {
                currentHTML += text.charAt(i);
                i++;
            }
            element.innerHTML = currentHTML;
            if(i % 3 === 0) playSound('click');
            typewriterTimeout = setTimeout(type, speed);
        } else {
            isTyping = false;
        }
    }
    type();
}

// 快轉對話
function skipTyping() {
    if (isTyping && fullFormattedText) {
        clearTimeout(typewriterTimeout);
        document.getElementById('dialog-text').innerHTML = fullFormattedText;
        isTyping = false;
        playSound('click');
    }
}

function showHint(text) {
    const bubble = document.getElementById('mascot-speech');
    const container = document.getElementById('mascot-speech-container');
    if(text) {
        bubble.innerText = text;
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function updateUI() {
    initAudio(); 
    const scene = scenarios[currentState];
    const dialogElem = document.getElementById('dialog-text');
    const optionsElem = document.getElementById('options-container');
    const chapterElem = document.getElementById('chapter-title');
    const charNameElem = document.getElementById('char-name');
    const charRoleElem = document.getElementById('char-role');
    const progressBar = document.getElementById('progress-bar');
    const charAvatarIcon = document.getElementById('avatar-icon');
    const card = document.getElementById('scenario-card');
    const mascotImg = document.getElementById('mascot-image');

    if (currentState === 'start') {
        inventory = [];
        errorsCount = 0;
        updateInventoryUI();
    }
    
    // 進入遊戲後自動播放音樂
    if (soundEnabled && !isBgmPlaying && currentState !== 'start') {
        playBGM();
    }

    charAvatarIcon.className = `fa-solid ${scene.avatar || 'fa-user'}`;
    
    // 結算畫面加入評價
    let textToDisplay = scene.text;
    if (currentState === 'c10_success' && !textToDisplay.includes('最終評價')) {
        let rank = '';
        let rankColor = '';
        if (errorsCount === 0) { rank = 'S級 完美防禦大師'; rankColor = '#FFD700'; }
        else if (errorsCount <= 2) { rank = 'A級 職場生存菁英'; rankColor = '#C0C0C0'; }
        else if (errorsCount <= 5) { rank = 'B級 勞權防身新手'; rankColor = '#CD7F32'; }
        else { rank = 'C級 待磨練職場小白'; rankColor = '#ff6666'; }
        
        textToDisplay += `<br><br><span style="color: ${rankColor}; font-size: 1.15rem; font-weight: 800; display: block; padding: 12px; background: rgba(0,0,0,0.5); border-radius: 8px; border: 1px solid ${rankColor}; box-shadow: 0 0 15px ${rankColor}88; text-align: center;"><i class="fa-solid fa-trophy"></i> 最終評價：${rank} (失誤: ${errorsCount}次)</span>`;
    }

    // 特殊文字高亮 (粗體雙引號內的文字)
    let formattedText = textToDisplay.replace(/「(.*?)」/g, '<span class="highlight-text">「$1」</span>');
    typeWriter(formattedText, dialogElem);

    if (scene.chapter) chapterElem.innerText = scene.chapter;
    charNameElem.innerText = scene.speaker;
    charRoleElem.innerText = scene.role;
    progressBar.style.width = `${scene.progress}%`;

    // 顯示提示
    showHint(scene.hint || "");

    optionsElem.innerHTML = '';
    scene.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span>${opt.text}</span> <i class="fa-solid fa-arrow-right"></i>`;
        
        btn.onmouseenter = () => playSound('click');

        btn.onclick = (e) => {
            if (isTyping) skipTyping(); // 若在打字中點擊選項，先完成快轉
            
            if (opt.type === 'bad') {
                errorsCount++;
                createParticles(e.clientX, e.clientY, 'var(--danger)');
                mascotImg.style.filter = "drop-shadow(0 0 20px var(--danger)) hue-rotate(90deg)"; // 錯誤時吉祥物變色
                setTimeout(()=> mascotImg.style.filter = "", 1000);
            } else {
                playSound('success');
                createParticles(e.clientX, e.clientY, 'var(--primary)');
                mascotImg.style.transform = "scale(1.2) rotate(-10deg)"; // 答對時跳躍
                setTimeout(()=> mascotImg.style.transform = "", 300);
            }

            if (opt.knowledge && !inventory.includes(opt.knowledge)) {
                inventory.push(opt.knowledge);
                updateInventoryUI();
                playSound('item');
                const invDiv = document.getElementById('knowledge-inventory');
                invDiv.classList.add('glow-pulse');
                const rect = invDiv.getBoundingClientRect();
                createParticles(rect.left + rect.width/2, rect.top + rect.height/2, 'var(--accent-neon)');
                setTimeout(() => invDiv.classList.remove('glow-pulse'), 1000);
            }
            currentState = opt.next;
            saveProgress(); // 新增：選項選擇後自動儲存進度
            updateUI();
        };
        optionsElem.appendChild(btn);
    });

    card.classList.remove('shake-effect', 'danger-glow', 'success-glow');
    void card.offsetWidth;

    if (scene.text.includes('【失敗】') || scene.text.includes('【大危機】') || scene.text.includes('【損失權益】') || scene.text.includes('【嚴重吃虧】') || scene.text.includes('【違法行為】') || scene.text.includes('【違法解僱】') || scene.text.includes('【被道德綁架】') || scene.text.includes('【合約無效】') || scene.text.includes('【錯失良機】')) {
        playSound('error');
        card.classList.add('danger-glow', 'shake-effect');
        charAvatarIcon.style.color = 'var(--danger)';
    } else if (scene.progress === 100) {
        playSound('success');
        card.classList.add('success-glow');
        createParticles(window.innerWidth/2, window.innerHeight/2, 'var(--success)');
        charAvatarIcon.style.color = 'var(--success)';
        showHint("太神啦！你全破了！");

        // 加入知識點複習功能
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'option-btn';
        reviewBtn.innerHTML = `<span><i class="fa-solid fa-layer-group"></i> 總複習字卡</span> <i class="fa-solid fa-arrow-right"></i>`;
        reviewBtn.style.marginTop = "1rem";
        reviewBtn.style.border = "2px solid var(--accent-neon)";
        reviewBtn.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.4)";
        reviewBtn.onmouseenter = () => playSound('item');
        reviewBtn.onclick = openReviewModal;
        optionsElem.appendChild(reviewBtn);

        // 加入證書功能
        const certBtn = document.createElement('button');
        certBtn.className = 'option-btn';
        certBtn.innerHTML = `<span><i class="fa-solid fa-award"></i> 下載結業證書</span> <i class="fa-solid fa-download"></i>`;
        certBtn.style.marginTop = "1rem";
        certBtn.style.border = "2px solid var(--warning)";
        certBtn.style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
        certBtn.onmouseenter = () => playSound('item');
        certBtn.onclick = openCertificateModal;
        optionsElem.appendChild(certBtn);

    } else {
        charAvatarIcon.style.color = 'white';
        card.classList.add('active-effect');
        setTimeout(() => card.classList.remove('active-effect'), 500);
    }
}

// 知識點複習字卡邏輯
let currentReviewIndex = 0;

function openReviewModal() {
    if (inventory.length === 0) return;
    currentReviewIndex = 0;
    document.getElementById('review-modal').classList.remove('hidden');
    document.getElementById('review-close-btn').onclick = () => document.getElementById('review-modal').classList.add('hidden');
    
    document.getElementById('review-prev-btn').onclick = () => {
        if (currentReviewIndex > 0) {
            currentReviewIndex--;
            updateReviewCard();
            playSound('click');
        }
    };
    
    document.getElementById('review-next-btn').onclick = () => {
        if (currentReviewIndex < inventory.length - 1) {
            currentReviewIndex++;
            updateReviewCard();
            playSound('click');
        }
    };

    updateReviewCard();
}

function updateReviewCard() {
    const titleElem = document.getElementById('review-card-title');
    const contentElem = document.getElementById('review-card-content');
    const counterElem = document.getElementById('review-counter');
    const card = document.getElementById('review-card');

    // 播放動畫
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.style.transform = 'scale(1)', 150);

    let parts = inventory[currentReviewIndex].split('：');
    if (parts.length > 1) {
        titleElem.innerText = `知識 ${currentReviewIndex + 1}：` + parts[0];
        contentElem.innerText = parts.slice(1).join('：');
    } else {
        titleElem.innerText = `知識 ${currentReviewIndex + 1}：`;
        contentElem.innerText = inventory[currentReviewIndex];
    }
    
    counterElem.innerText = `${currentReviewIndex + 1} / ${inventory.length}`;
    
    // 更新按鈕狀態
    document.getElementById('review-prev-btn').style.opacity = currentReviewIndex === 0 ? "0.3" : "1";
    document.getElementById('review-next-btn').style.opacity = currentReviewIndex === inventory.length - 1 ? "0.3" : "1";
}

function openCertificateModal() {
    const modal = document.getElementById('cert-modal');
    modal.classList.remove('hidden');
    document.getElementById('cert-name-input').focus();
    
    document.getElementById('cert-cancel-btn').onclick = closeCertificateModal;
    document.getElementById('cert-confirm-btn').onclick = () => {
        let userName = document.getElementById('cert-name-input').value.trim();
        if (!userName) userName = "勞權小尖兵";
        closeCertificateModal();
        doGenerateCertificate(userName);
    };
}

function closeCertificateModal() {
    document.getElementById('cert-modal').classList.add('hidden');
}

function doGenerateCertificate(userName) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // 繪製背景 (賽博龐克風格)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0514');
    gradient.addColorStop(1, '#1a0b2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製邊框
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // 標題
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 36px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.fillText('高中集體勞動權益結業證書', canvas.width / 2, 120);
    ctx.shadowBlur = 0; // 重置陰影

    // 內文
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px "Noto Sans TC", sans-serif';
    ctx.fillText(`茲證明`, canvas.width / 2, 220);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 45px "Noto Sans TC", sans-serif';
    ctx.fillText(userName, canvas.width / 2, 300);

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '24px "Noto Sans TC", sans-serif';
    ctx.fillText('已成功通過「高中集體勞動權益冒險」所有考驗', canvas.width / 2, 380);
    ctx.fillText('具備了卓越的勞動法律知識與自我保護能力。', canvas.width / 2, 430);

    // 底部資訊
    ctx.fillStyle = '#8c9bb0';
    ctx.font = '18px "Noto Sans TC", sans-serif';
    const date = new Date();
    ctx.fillText(`頒發日期：${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`, canvas.width / 2, 520);
    ctx.fillText('Copyright © Liyuchiutiger Gongminshen', canvas.width / 2, 550);

    // 下載圖片
    const link = document.createElement('a');
    link.download = `高中集體勞權證書_${userName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    playSound('success');
}

// 拖曳吉祥物邏輯 (保持不變)
const mascot = document.getElementById('mascot-container');
let isDragging = false;
let startX, startY, initialLeft, initialTop;

mascot.addEventListener('mousedown', (e) => {
    isDragging = true; startX = e.clientX; startY = e.clientY;
    initialLeft = mascot.offsetLeft; initialTop = mascot.offsetTop;
    mascot.style.transition = 'none'; playSound('item'); e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    mascot.style.left = `${initialLeft + (e.clientX - startX)}px`;
    mascot.style.top = `${initialTop + (e.clientY - startY)}px`;
    mascot.style.bottom = 'auto'; mascot.style.right = 'auto';
});

document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; playSound('click'); } });

// Touch support
mascot.addEventListener('touchstart', (e) => {
    isDragging = true; const touch = e.touches[0];
    startX = touch.clientX; startY = touch.clientY;
    initialLeft = mascot.offsetLeft; initialTop = mascot.offsetTop;
    mascot.style.transition = 'none'; playSound('item');
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return; const touch = e.touches[0];
    mascot.style.left = `${initialLeft + (touch.clientX - startX)}px`;
    mascot.style.top = `${initialTop + (touch.clientY - startY)}px`;
    mascot.style.bottom = 'auto'; mascot.style.right = 'auto'; e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => { isDragging = false; playSound('click'); });

// 加入畫面點擊快轉與鍵盤支援 (1, 2, Space)
const scenarioCard = document.getElementById('scenario-card');
if (scenarioCard) {
    scenarioCard.addEventListener('click', (e) => {
        // 確保點擊的不是按鈕或連結
        if (!e.target.closest('.option-btn') && !e.target.closest('button')) {
            skipTyping();
        }
    });
}

document.addEventListener('keydown', (e) => {
    // 忽略在輸入框內的按鍵
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (isTyping) {
            skipTyping();
        } else {
            // 如果只有一個選項按鈕(例如失敗時的重試，或是大結局)，直接點擊
            const opts = document.querySelectorAll('#options-container .option-btn');
            // 排除複習字卡跟證書按鈕
            if(opts.length === 1 && !opts[0].innerHTML.includes('fa-layer-group') && !opts[0].innerHTML.includes('fa-award')) {
                opts[0].click();
            }
        }
    }
    else if (e.code === 'Digit1' || e.code === 'Numpad1') {
        const opts = document.querySelectorAll('#options-container .option-btn');
        if(opts.length >= 1) {
            if(isTyping) skipTyping();
            opts[0].click();
        }
    }
    else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        const opts = document.querySelectorAll('#options-container .option-btn');
        if(opts.length >= 2) {
            if(isTyping) skipTyping();
            opts[1].click();
        }
    }
});

window.onload = () => {
    loadProgress();
    updateUI();
};