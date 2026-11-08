# ATTENTION V2 · 注意巡警

工程心理学作业二。任务一是 W5 SEEV 城市四屏监控，任务二是中文、英文与情绪 Stroop。流程为首页、知情同意、匿名编号、巡逻任务台、四屏监控、任务一结果、Stroop、任务二结果及最终下载。公开网址在 GitHub Pages 发布后补填。

## 启动与提交

- 双击 `index.html` 可使用键盘版。本机实验、统计和下载可离线运行。课程上传与全体结果读取需要网络。
- 摄像头版使用桌面 Chromium。进入本目录执行 `python -m http.server 8000`，再访问 `http://localhost:8000/`。发布后使用 GitHub Pages 的 HTTPS 网址。两种玩法都请使用实体键盘。
- GitHub Pages 使用课程仓库的 `main` 和 `/ (root)`。提交 `index.html`、`style.css`、`js/`、`assets/`、`vendor/` 和 `.nojekyll`。资源使用相对路径，可从仓库子路径加载。
- 网址加 `?test=1` 进入先导模式，使用独立的本机记录，并在结果页手动提交 `test_seev_city_monitor` 或 `test_stroop_v2`。正式模式保存每场的完整本机备份后自动提交。建议先用测试入口在真实设备上走通摄像头和课程后台回执。
- 现有项目码沿用。SEEV 使用 `ELX893` 和实验名 `seev_city_monitor`。Stroop 使用 `EVE2EL` 和实验名 `stroop_v2`。协议标识为 `patrol-2.0.0`。V1 与 V2 使用独立本机存储，V1 数据仍可用 V1 程序读取。

## 练习与正式记录

SEEV 有 5 次异常练习，Stroop 在每模块前有 4 题练习。练习刺激和反馈只存在于当前页面内存。练习时不创建运行编号、正式试次对象或眼动订阅，不写入按键、反应时、正确率、日志、备份、CSV、JSON 或课程接口。眼动校准和四区验证在独立页面完成。刷新或返回任务台后，尚未开始作答的模块会重新练习。

正式开始时才创建运行记录，两场分别从 1 编号。正式行带 `phase=formal`、协议版本、运行编号及 `record_mode`。练完即退时，任务台没有该任务的下载项。正式中途退出可下载已写入的正式数据。下载前校验来源、顺序及条件数量，完整上传只接受 40 条 SEEV 或 30 条 Stroop。上传超时后按运行编号核验，避免重复提交。全体结果筛选 V2 正式实验名和版本，排除先导、旧协议和不完整记录。每个匿名编号最多纳入一份有有效行为的完整记录。

## W5 SEEV 城市四屏监控

高优先级异常的漏报代价更高。出现小怪时，按 `1 / 2 / 3 / 4` 报告左上、右上、左下、右下。四个窗口复用同一张城市图和同一只小怪，使用同样的标签样式。作答不会提前移除小怪。正式监控不显示对错反馈。

| 布局 | 高优先级窗口 | 正式异常 |
| --- | --- | --- |
| 交错 | 对角线一对 | 高优先 10，普通 10 |
| 相邻 | 同一列一对 | 高优先 10，普通 10 |

两段各 56 秒，每段四窗各出现 5 次。每段分成 20 个 2800 ms 区段。小怪在区段开始后 820、970、1120 或 1270 ms 计划出现，四种延迟等频并打乱，显示及反应窗为 1400 ms。以动画帧实际呈现时间计算反应时。每窗事件顺序随机，P001–P008 轮换两布局顺序、两条对角线和左右列。用匿名编号和运行编号可恢复同一正式计划。

每个区段对应一条正式异常记录，区分正确、错报、超时漏报。小怪实际消失后的空窗按键计作误报，按区段保存在 `false_alarms`，不增加记录数。Esc、切页、失焦、改变窗口大小或帧间隔超过 150 ms 会暂停。已出现但尚未保存的异常以中断标记写入，排除于行为和眼动分析。未出现的区段继续时从头开始。刷新从最近保存的区段继续。正式记录包含布局、优先级、目标窗、计划出现时刻、按键、反应时及结果。

个人结果报告各布局和优先级的有效异常数、未正确报告率、漏报、错报、正确反应时与空窗误报。主要行为对比为高优先级异常未正确报告率，定义为「漏报＋错报」除以该条件有效异常数。差值统一为相邻减交错。相邻布局是新增实测条件。可由作者在正式收数前确定方向假设，例如检验同列高优先窗口是否减少跨列切换并降低未正确报告率。两种布局保持异常率一致，实验检验的是优先级与空间布局下的注意分配。它是 SEEV 框架的课堂应用，任务与原驾驶模拟研究有差异。[Horrey、Wickens 与 Consalus，2006](https://pubmed.ncbi.nlm.nih.gov/16802889/)

## 眼动

摄像头单独征求同意。9 个校准点各注视并点击 5 次，然后依次验证四个实际画面的中心。每点约 1900 ms，跳过前 500 ms。每区至少 10 个非空预测，其中至少 60% 落在目标画面内，四区均通过后才进入眼动版。拒绝、校准失败或设备不可用时可用键盘版。离开任务一时关闭摄像头，窗口改变时需重新校准才能继续使用眼动。

正式阶段只在小怪未显示时累计四个画面内的采样次数。边框、窗口间距和画面外都不归入任何区域。每种布局至少 80 个区内样本，且至少一半预测回调落在实际画面内，才计算眼动指标。高优先注视比例为两个高优先画面样本数除以四窗有效区内样本数。个人结果用四格色阶展示。组结果分别报告行为有效、至少一布局眼动有效、两布局均眼动有效人数。眼动差值仅用两布局均达标的参与者。视频与原始坐标在本机处理。上传的数据只含回调总数与四窗计数。

## 中英情绪 Stroop

判断墨色。始终显示色块、中文颜色名和键帽。固定映射为 F 红、G 蓝、J 绿、K 紫。刺激区使用中性背景，三模块沿用同样的键位、颜色及呈现位置。每条件四种墨色都出现，第五题的墨色随编号轮换，三模块顺序按六种排列轮换。

| 模块 | 正式条件 | 反应时差值 |
| --- | --- | --- |
| 中文 | 一致 5，不一致 5 | 不一致 − 一致 |
| 英文 | 一致 5，不一致 5 | 不一致 − 一致 |
| 情绪 | 中文负性词 5，中文中性词 5 | 负性 − 中性 |

**每条件只有 5 次，低于课程每条件 10 次的要求。** 这版依照指定时长采用 30 次设计，个人差值容易受单次异常反应影响，讨论时应注明。英语熟悉度为匿名选填。先呈现约 420 ms 注视点，刺激后限时 3000 ms。超时计错，小于 150 ms 的按键和中断试次排除。反应时仅统计有效正确反应。配对差先按个人计算，再汇总组均值及标准差。情绪词表沿用 V1 的候选词，条件内抽取 5 个，轮换未呈现词项。作者在正式收数前确认词表、预测与材料的可比性。[原始 Stroop 研究](https://doi.org/10.1037/h0054651) · [双语研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC3590568/) · [情绪 Stroop](https://pubmed.ncbi.nlm.nih.gov/15355142/) · [情绪词表](https://doi.org/10.1371/journal.pone.0132294.s001)

## 时长与先导

流程预算为 SEEV 约 4 分钟、Stroop 约 3 分钟、页面衔接约 1 分钟，含一次常规校准、各模块练习及短休息。知情同意阅读、反复校准和下载由参与者自行掌握。程序固定的 SEEV 正式监控为 112 秒，练习为 10.5 秒。Stroop 作答速度随参与者变化。

在 Chromium 按真实刺激时钟走查，使用自动按键和约 2 秒的组间停留。SEEV 按键版用时 127.7 秒。摄像头路径用时 154.6 秒，含一次设备授权、九点校准、四区验证、练习及两段正式监控。Stroop 三组练习和正式作答用时 53.9 秒。两场按摄像头路径的分段计时合计 208.5 秒。这是程序走查用时，参与者的阅读和作答速度会影响实际用时。

浏览器验收覆盖双击入口、模拟 Pages 仓库子路径、摄像头允许及跳过、校准后关闭摄像头、常驻键位横条、错报和漏报、空窗误报、刷新、模拟断网和上传核验。练习后退出检查显示 SEEV 无运行、下载和 POST。完成 Stroop 练习后退出也无新增运行或 POST，后续模块的练习前后正式记录一致。最终 CSV、JSON 和模拟待上传请求均为 40 条 SEEV 加 30 条 Stroop，全部标为正式。摄像头验收使用 Chromium 模拟设备及注视坐标，课程项目只做只读查询。真实设备先导、课程后台实传及公开 Pages 发布待完成。

正式采集前由作者确认并提交假设、词表、眼动质量阈值和分析规则。招募至少 5 名他人后，再解释 SEEV 主要差值和中英情绪 Stroop 的结果。当前结果页在没有合格正式数据时显示空状态。

## 文件与素材

- `js/design.js` 管理布局顺序、事件安排及 Stroop 配平。`js/runner.js` 管理呈现、按键和练习分流。`js/gaze.js` 管理眼动。`js/data.js` 负责正式写入、来源校验、备份、提交和核验。`js/stats.js` 与 `js/results.js` 负责统计及图表。
- 首页五位巡警、果冻字标和任务二插画沿用 V1。内置 imagegen 生成的 V2 底纹用于非实验页面，静态城市图用于四个监控窗口，透明小怪由程序控制显隐。以下为生成提示词。
- `assets/pattern-v2.webp` — Use case: stylized-concept. Asset: seamless repeating Y2K pixel wallpaper for an engineering psychology game website, square. Very low contrast warm ivory / cream background, tiny evenly spaced 8-bit outline stars, hearts, retro flip communicators, four-bar signal indicators and small printed halftone clusters. Restrained pastel lime, hot pink tinted almost white, ice blue, lavender, butter yellow and pale silver. Loose but uniform sparse arrangement with abundant empty space. Clean nearest-neighbor arcade pixel art; seamless edges; unobtrusive under website cards; no gradients, no words, no characters, no large elements or border.
- `assets/city-v2.webp` — Use case: scientific-educational. Asset: one wide static pixel-art city camera feed, 16:9 landscape. A quiet late-evening retro city with simple distant cool slate, dark lavender and desaturated blue building silhouettes and a few dim windows. An expansive calm dark blue-gray open sky in the entire middle third, with rooftops mostly in the bottom third, so a small bright stimulus can appear at the exact center against a uniform dark region. Balanced luminance, low spatial clutter, 16-bit retro pixel game with deliberate crisp pixels, restrained ice-blue and lavender accents. No people, ghosts, foreground icons, warning colors, animations, text, frames, UI or watermark. Edge-to-edge single image, no collage.
- `assets/ghost-v2.webp` — Use case: stylized-concept. Asset: single isolated transparent original pixel sprite for a visual monitor experiment. A small arcade apparition with a circular dome, two straight sides, stepped zigzag skirt, glowing pale acid-lime body and a dark navy pixel keyline. Tiny two navy square eyes and one offset pale lavender pixel accent give it an original expressive face. Strict low-resolution pixel art, solid clearly defined silhouette, centered square crop with minimal transparent margins. Exactly one monster. No letters, border, glow spill, shadow, ground, badges or background.
- 自托管 WebGazer 3.5.3 与 MediaPipe Face Mesh 0.4.1633559619。许可证在 `vendor/webgazer/`。[WebGazer 对应源码](https://github.com/brownhci/WebGazer/tree/b12701dd7b6d7b00d4b8dbebf87fdec840c24999) · [WebGazer 论文](https://www.ijcai.org/Proceedings/16/Papers/540.pdf)

AI 使用说明。Codex 辅助更新程序和文档，内置 imagegen 生成像素素材。作业作者确认研究假设并采集、解释真实数据。
