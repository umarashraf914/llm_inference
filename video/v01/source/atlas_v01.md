# The Memory Wall
_From what inference is, through the transformer's structure and the roofline, to the KV cache and the four numbers a serving system is judged on. Built from the ground up, in the order the video covers it. Timestamps mark your position in the video, not the extent of a figure._


## Before we start
_What a model is, what a token is, and what running one actually involves. Skip this part if it is already familiar._

### Fig 01 · 0:00
**What a model actually is**
- [HEAD] A trained model is a file
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [sub] 0.13
- [sub] -0.7
- [sub] 0.02
- [sub] 1.44
- [sub] -0.3
- [PROSE] Nothing else is in there. No rules, no instructions, no text. Just a very long list of numbers, each one somewhere between about minus one and plus one. Forty are drawn. A large model has seventy billion of them. Each number is called a parameter, or a weight. The two words mean the same thing and this document uses both.
> CAPTION: Worth starting here, because everything later is arithmetic on this list. Training produced the numbers; inference is the business of using them.

### Fig 02 · 0:00
**Two phases of a model's life**
- [LABEL] Training
- [sub] months, thousands of chips,
- [sub] done once
- [LABEL] Inference
- [sub] milliseconds, one chip or a few,
- [sub] done every time anyone asks
- [PROSE] Training is the search for the seventy billion numbers. It reads an enormous amount of text and adjusts them until the model predicts well. Inference is using those numbers. They never change again. Every answer the model ever gives comes from the same fixed list. This entire series is about the second box. The first is finished before anything here begins.
> CAPTION: Worth separating at the outset, because almost every confusing claim about cost or speed turns out to be about the wrong one of these two.

### Fig 03 · 0:00
**Where the numbers came from**
- [HEAD] How the numbers were found, in three steps
- [sub] guess the next word
- [sub] compare with the real one
- [sub] nudge every weight
- [sub2] repeat, over an enormous amount of text
- [PROSE] Each nudge is tiny and there are trillions of them. Nobody chooses the values by hand and nobody can look at one and say what it is for. The result is a file of numbers that happens to predict text well. That is the whole of what a trained model is, and why the next figure matters.
> CAPTION: Deliberately brief: this series never trains anything. It is here so the word trained stops being a black box.

### Fig 04 · 0:00
**What one weight does**
- [HEAD] What one weight does
- [sub] input
- [HEAD] x
- [sub] weight
- [HEAD] =
- [sub] contribution
- [PROSE] A weight is a dial. It decides how much one number influences the next one. A weight of 0 means the input is ignored entirely. A large weight means it dominates. A negative weight means it pushes the other way. That is the whole of what a weight does. Training was the process of finding seventy billion settings for these dials such that the output text is useful.
> CAPTION: A single multiplication. The model's intelligence is not in any one of these; it is in how seventy billion of them combine.

### Fig 05 · 0:00
**Many weights make one output**
- [HEAD] Many weights, one output
- [sub] input 1
- [sub2] x
- [sub] weight
- [sub] input 2
- [sub2] x
- [sub] weight
- [sub] input 3
- [sub2] x
- [sub] weight
- [sub] input 4
- [sub2] x
- [sub] weight
- [sub] input 5
- [sub2] x
- [sub] weight
- [sub] add them up
- [sub] one output
- [PROSE] Multiply each input by its own weight, then add the results together. That is one output value, and it is the only arithmetic pattern the model performs. Every layer of every large language model is this, repeated at enormous scale.
> CAPTION: Multiply and add. Hold onto this picture: the operation count later in this document is built directly out of it.

### Fig 06 · 0:00
**What a token is**
- [HEAD] Text is cut into pieces called tokens
- [sub] the quick brown fox jumps
- [sub] the
- [sub] quick
- [sub] brown
- [sub] fox
- [sub] jumps
- [sub2] five tokens
- [PROSE] Roughly a word each, though not exactly. Common words are one token; rarer ones split into two or three pieces. Five hundred words of English comes to about six to eight hundred tokens. The model never sees letters. It works only in these pieces, and it produces them one at a time.
> CAPTION: The unit everything in this series is counted in: tokens per second, cost per token, milliseconds per token.

### Fig 07 · 0:00
**Generating means running the model again and again**
- [LABEL] One turn of the loop
- [sub] text so far
- [sub] run the whole model
- [sub] one new token
- [sub2] append it to the text and go round again
- [PROSE] The model does not write a sentence. It predicts one token, that token is added to the end of the text, and the entire model runs again from the start to predict the next one. A two-hundred-word answer means running the whole seventy-billion-parameter model about three hundred times, once per token.
> CAPTION: This loop is the shape of the entire problem. Almost everything difficult about inference follows from having to repeat the whole model per token.

### Fig 08 · 0:00
**What the model actually produces**
- [HEAD] The model does not choose a word. It scores every word it knows.
- [PROSE] cat
- [sub2] 8.2
- [PROSE] dog
- [sub2] 7.1
- [PROSE] the
- [sub2] 3.5
- [PROSE] banana
- [sub2] 0.4
- [sub2] and 127,996 more, all scored
- [PROSE] Every token in the vocabulary gets a number saying how well it would fit next. Higher means better. These raw numbers are called scores, or logits. The scores are illustrative; the shape is not. One or two candidates stand out and the rest trail off to nothing.
> CAPTION: The single most common misconception about language models is that they pick a word. They produce a hundred and twenty-eight thousand numbers, and something else picks.

### Fig 09 · 0:00
**Turning scores into probabilities**
- [HEAD] Scores become shares of one whole
- [sub] each score becomes e to that power, then divide by the total
- [PROSE] cat
- [sub2] 8.2
- [sub2] 3,641
- [sub2] 74.5%
- [PROSE] dog
- [sub2] 7.1
- [sub2] 1,212
- [sub2] 24.8%
- [PROSE] the
- [sub2] 3.5
- [sub2] 33
- [sub2] 0.68%
- [PROSE] banana
- [sub2] 0.4
- [sub2] 1.5
- [sub2] 0.03%
- [PROSE] The four shares add up to 1.00. Raising e to each score makes every value positive, and dividing by the total turns them into shares of one whole. That step is called softmax, and it is why a model's output is described as a probability. Notice what the exponential did: a score of 8.2 against 7.1 is a gap of one, but the shares come out 74% against 25%. Small differences in score become large differences in confidence.
> CAPTION: Worked with real arithmetic. The last line is the part that surprises people: the exponential exaggerates every gap.

### Fig 10 · 0:00
**Why the same question gives different answers**
- [HEAD] One probability list, two different answers
- [sub] cat, 74.5%
- [sub] dog, 24.8%
- [sub2] run once, and cat is likely
- [sub2] run again, and dog can win
- [PROSE] The model gives the same list every time. What varies is the draw made from it: a token is picked at random, in proportion to those shares. So a quarter of the time the second candidate is chosen, and the answer takes a different turn from there on. That is why the same question can produce different answers, and why nothing about the model itself has changed when it does.
> CAPTION: A frequent source of confusion, and the answer is entirely in the last step rather than in the model.

### Fig 11 · 0:00
**Thirty milliseconds, per token**
- [HEAD] One turn of that loop takes about 30 milliseconds
- [sub2] one second of output: about 33 tokens
- [PROSE] Thirty milliseconds is three hundredths of a second. Fast enough that the text appears to stream out at reading speed, which is exactly the target. This number is the subject of the whole video. By the end you will be able to derive it from two hardware specifications, for any model on any chip.
> CAPTION: Not an arbitrary figure. It is roughly the slowest a model can generate while still feeling responsive to a reader.

### Fig 12 · 0:00
**Where the file actually lives**
- [HEAD] The same file, in three places
- [sub] A disk
- [sub2] where the file is kept between runs
- [sub] Memory beside the chip
- [sub2] where it sits while the service runs
- [PROSE] The chip itself
- [sub2] holds a few hundred kilobytes at a time
- [PROSE] Bars are roughly to scale for capacity. The disk holds far more than it needs to; the memory holds exactly the model; the chip holds almost nothing. Reading all 140 gigabytes off a disk takes many seconds. From the memory beside the chip it takes tens of milliseconds. That is why the model is loaded once at start-up and then left there for as long as the service runs.
> CAPTION: Three tiers, and the middle one is where this whole series takes place. The disk appears once, at start-up, and is never mentioned again.

### Fig 13 · 0:00
**Loading happens once**
- [HEAD] Once at start-up, then never again
- [sub] load: many seconds
- [sub] serve: milliseconds per token, for hours
- [PROSE] The loading cost is real but it is paid once. A server that has been up for a day has paid it once and answered millions of tokens. This is the first example of a pattern that runs through the whole series: a fixed cost stops mattering once it is spread over enough work. The rest of the series is about a cost that refuses to spread that way.
> CAPTION: Introduces amortisation gently, on a cost where it obviously works, before meeting the cost where it obviously does not.

### Fig 14 · 0:00
**Where the thirty milliseconds comes from**
- [HEAD] Where thirty milliseconds comes from
- [sub] time per token = bytes to read / bytes read per second
- [PROSE] H100, 3.35 TB/s
- [sub2] 41.8 ms per token
- [PROSE] H200, 4.8 TB/s
- [sub2] 29.2 ms per token
- [PROSE] B200, 8 TB/s
- [sub2] 17.5 ms per token
- [PROSE] 140 gigabytes of weights, divided by how fast each chip can read. The middle row lands on twenty-nine milliseconds, which is where the video's round figure of thirty comes from. The number is not a guess or a benchmark. It is a division, and it changes when either the model size or the memory speed changes. Later in this video the same division is done on the H100 and gives about twenty-four tokens a second. Both are correct; they are different chips.
> CAPTION: Two figures in this video that look inconsistent are reconciled here. Worth doing, because noticing the tension and resolving it is exactly the habit this material rewards.


## What inference is
_The engineering between a trained checkpoint and a chat window._

### Fig 15 · 0:00
**One token, every 30 milliseconds**
- [LABEL] A trained checkpoint
- [sub] weights on disk
- [LABEL] A service that responds
- [sub] a token every 30 ms
- [PROSE] Everything between those two boxes is inference. This video is about why that gap is 30 milliseconds and not something much smaller.
> CAPTION: Training produces the weights. Inference is the discipline of turning them into something a user can actually talk to, at a price that works.

### Fig 16 · 0:23
**What a server is**
- [LABEL] A server
- [sub] a few GPUs
- [sub] always on, in a data centre
- [LABEL] Your laptop
- [sub] one small chip
- [sub] on when you open it
- [PROSE] The model does not run on your device. It runs on machines in a building somewhere, and your question travels there and back over the network. A data centre is a warehouse full of those machines, with the power and cooling to keep them running continuously. Everything in this series is about what happens inside one of those machines in the fraction of a second after your question arrives.
> CAPTION: Grounding for the word production. The constraints below only make sense once you picture hardware that is shared, always on, and paid for by the hour.

### Fig 17 · 0:23
**The components**
- [LABEL] The stack a request passes through
- [LABEL] Router
- [sub] which machine
- [LABEL] Scheduler
- [sub] batch with others
- [LABEL] Memory manager
- [sub] which weights, which chip
- [LABEL] Kernels
- [sub] the actual arithmetic
- [LABEL] Orchestration
- [sub] wiring it together
- [PROSE] Five layers, each solving a different problem. By the end of this series you should be able to look at any production system and say why each one is there.
> CAPTION: Only one of these does arithmetic. The other four exist because arithmetic is not the thing that makes inference hard.

### Fig 18 · 0:46
**Why this matters commercially**
- [PROSE] Share of AI compute
- [sub] about two thirds, 2026
- [PROSE] Hyperscaler AI capex
- [sub] around $700 billion this year
- [PROSE] One API's daily volume
- [sub] over 20 trillion tokens
- [PROSE] At this scale every architectural decision, from chip layout to memory hierarchy to scheduling policy, collapses into one number.
- [sub] cost per token
- [PROSE] Inference is now the majority of the spend, not training. That is a recent inversion, and it is why this stack gets so much engineering attention.
> CAPTION: The projections are inherently uncertain, but the direction is not: serving models is where the compute and the money now go.

### Fig 19 · 0:46
**What production traffic means**
- [HEAD] Production traffic: everyone at once
- [sub] one set of machines
- [PROSE] Not one user waiting politely. Thousands of separate conversations arriving at unpredictable moments, all needing the same machines. That crowd turns out to be the thing that makes the economics work, for reasons the later videos are almost entirely about. It also means one slow request delays other people, which is why the measurements at the end of this video are about the worst case rather than the average.
> CAPTION: The word production is doing real work in this series. It means shared, concurrent and paid for, which is a different problem from running a model once on your own machine.

### Fig 20 · 0:46
**What one request contains**
- [LABEL] What arrives at the server
- [sub] the conversation so far
- [sub] the new question
- [sub] settings: how long, how random, when to stop
- [PROSE] The whole conversation is sent every time, not just the new question. The model has no memory between requests, so anything it needs to know must arrive with the request. A long conversation therefore means a long input, every single turn. That fact returns near the end of this video as the reason one particular cost keeps growing.
> CAPTION: The stateless part is the surprise. Each turn re-sends everything, which is why conversation length becomes a hardware problem rather than a bookkeeping one.

### Fig 21 · 0:46
**Nothing lives in the model**
- [HEAD] The weights do not know your system prompt
- [sub] 140 GB of weights: identical for every user, every request, forever
- [PROSE] Nothing the operator writes is stored in the model. Training finished long before that text existed, and the weights have not changed since.
- [sub] so anything that shapes the answer must be in the context, that pass
- [PROSE] There is no other channel. The model conditions on exactly one thing: the tokens in front of it at that moment. So the answer to your question is already half settled. The system prompt, the tool definitions and any loaded skill are in your context every single turn, without exception.
> CAPTION: The architectural fact everything else hangs on. There is no cupboard on the server the model can reach into; the context window is the only input it has.

### Fig 22 · 0:46
**Two questions that get confused**
- [LABEL] Does it reach the context?
- [sub] Always yes, every turn,
- [sub] for every one of these
- [LABEL] Does it cross the network
- [sub] from your device?
- [sub] That varies
- [PROSE] These get treated as one question and they are not. The first is forced by the architecture. The second is a product decision about where the text is stored. A system prompt held by the provider never travels from your machine. A system prompt written by a developer using the API travels with every call they make. Either way it ends up in the same place, occupying the same tokens, costing the same prefill. The rest of this part is about the second question only, because the first has no exceptions.
> CAPTION: Where something is stored and where it ends up are different. Only the storage varies; the destination never does.

### Fig 23 · 0:46
**Where the text is stored before it is assembled**
- [HEAD] Three places the text can sit before the request is assembled
- [sub] On your device
- [sub2] your app holds it and sends it
- [sub2] a developer's own system prompt
- [sub] On the server, for you
- [sub2] stored against your account
- [sub2] custom instructions, project files
- [sub] On the server, for everyone
- [sub2] one copy, shared by all users
- [sub2] the provider's system prompt
- [sub] all three end up in one assembled prompt
- [PROSE] The serving system glues them together in a fixed order before the model sees anything: the most shared text first, then anything specific to you, then the conversation, then your newest message. That order is not cosmetic. It is chosen so the longest possible prefix is identical between requests, which is what makes the cache useful.
> CAPTION: Three storage locations, one destination. The ordering of the assembled prompt is a deliberate consequence of how prefix matching works.

### Fig 24 · 0:46
**Descriptions go into the context, code does not**
- [HEAD] For a tool, two very different things exist
- [LABEL] The description
- [sub] name, arguments, what it returns.
- [sub] Text. Goes into the context.
- [LABEL] The implementation
- [sub] the code that actually runs.
- [sub] Never enters the context.
- [PROSE] The model cannot execute anything. It emits text in a shape the serving system recognises as a call, and ordinary software outside the model runs the code and hands back a result. So a plugin's code lives wherever it lives, on a server or on your machine, and the model never sees a line of it. What the model needs is only enough description to know the tool exists and how to phrase a call. That is why a tool with a long description costs you tokens on every turn while a tool with a thousand lines of code costs you none.
> CAPTION: The distinction that makes tools affordable. The expensive part of a tool, by token count, is its documentation, not its behaviour.

### Fig 25 · 0:46
**Why skills are loaded only when needed**
- [HEAD] Always present: just enough to know what exists
- [sub] skill 1
- [sub] skill 2
- [sub] skill 3
- [sub] skill 4
- [sub] skill 5
- [sub] skill 6
- [sub] skill 7
- [sub] skill 8
- [sub2] a name and one sentence each, about 30 tokens apiece
- [HEAD] Loaded only when one is actually needed
- [sub] skill 1
- [sub] skill 2
- [sub2] the other six stay as one-line descriptions
- [sub2] its full instructions enter the context, about 2,000 tokens
- [PROSE] Forty skills at thirty tokens is 1,200 tokens, which is affordable. The same forty fully loaded would be 80,000 tokens and would fill 40% of a large window before you typed anything. So the descriptions are always there and the contents are fetched when the description matches what you asked for. Loading one costs about 3,200 tokens instead of 80,000. A plugin is a bundle of skills and tools, and it behaves the same way: the catalogue is cheap, the contents are fetched on demand.
> CAPTION: Progressive disclosure, and the arithmetic that forces it. Keeping every skill's full text resident would cost more window than the conversation.

### Fig 26 · 0:46
**Why the shared preamble is always warm**
- [HEAD] The most shared text in the whole system
- [sub] user
- [sub] user
- [sub] user
- [sub] user
- [sub] user
- [sub] user
- [sub] user
- [sub] user
- [sub] user
- [sub] the same system prompt, token for token
- [PROSE] Because it is identical for everyone, its keys and values are computed once per machine and then reused for every request that lands there. It is the single most reliable cache hit in the system, and it stays warm precisely because so many people share it. Your own conversation is evicted overnight; this is not. Which is why providers price a cached read at about a tenth of a fresh one. A large fixed preamble is cheap to serve, and the discount reflects that. It is also why editing it is expensive: one changed token invalidates that shared prefix for every user at once.
> CAPTION: The one block of text everybody in the world is sharing. Its warmth is not luck; it is a consequence of being shared, and it is why cached input is priced separately.

### Fig 27 · 0:46
**What you pay for before you type**
- [HEAD] What sits in front of your first word, and who put it there
- [PROSE] provider's system prompt
- [sub2] 2,000 tokens
- [PROSE] your custom instructions
- [sub2] 300 tokens
- [PROSE] tool definitions
- [sub2] 450 tokens
- [PROSE] one loaded skill
- [sub2] 2,000 tokens
- [sub2] total
- [sub] 4,750 tokens
- [PROSE] None of it was written by you, and all of it counts against your window and your bill on every single turn. Where it was stored changes who transmits it. It does not change that you are paying to have it prefilled and attended over, every time. Figures are illustrative. The shape is not: the preamble is usually far larger than anything the user types.
> CAPTION: Storage location is invisible to you. Token count is not, and the preamble is almost always the largest thing in the request.

### Fig 28 · 0:46
**How your device and the server actually talk**
- [HEAD] Up: once, at the start
- [sub] your device
- [sub2] the whole prompt, 1,032 tokens, about 4 KB
- [sub] the server
- [HEAD] Down: continuously, as each token is made
- [sub] your device
- [sub] the server
- [sub2] one small frame per token, down the connection that is already open
- [PROSE] One request goes up. The connection stays open, and the answer comes back a token at a time as it is produced. Nothing travels upward during generation. Your device sends nothing between the question and the end of the answer; it only listens. So it is neither of the two possibilities you might imagine. The text is not re-sent word by word, and the answer is not finished before any of it leaves.
> CAPTION: One journey up, many small journeys down, over a single open connection. This is what streaming means on the wire.

### Fig 29 · 0:46
**The loop on the server**
- [HEAD] What the server does with every token it makes
- [sub] one token appears
- [sub] down the wire, to you
- [sub] into the cache
- [sub2] its keys and values, appended
- [sub] and it becomes the next input
- [PROSE] Three things happen to each token, not one. It goes to you, its keys and values are appended to the cache, and the token itself becomes part of the input for the step after it. That third arrow is what autoregressive means: the model's own output is its next input. It is also why decode cannot be parallelised, because token 9 does not exist until token 8 is chosen. The loop runs until the model emits a stop token or reaches a length limit, and the cache is one entry longer after every turn of it.
> CAPTION: The arrow the previous figure left out. Your instinct was right: the server is feeding itself while it is feeding you.

### Fig 30 · 0:46
**Why there is not a round trip per token**
- [HEAD] A network round trip against the time to make one token
- [PROSE] Making one token
- [sub2] 30 ms
- [PROSE] Same city, there and back
- [sub2] 5 ms
- [PROSE] Seoul to Tokyo
- [sub2] 35 ms
- [PROSE] Seoul to the US west coast
- [sub2] 130 ms
- [HEAD] A 500-token answer, either way
- [PROSE] Streamed, one connection
- [sub] 15 s
- [PROSE] A round trip per token
- [sub] 80 s, from Seoul
- [PROSE] The waiting would dominate completely. Making the token is the cheap part; asking for it across an ocean is not. Which is why nothing works that way, and why the connection is opened once and held.
> CAPTION: Round-trip figures are typical rather than measured, and vary by route. The conclusion does not: per-token round trips would make generation several times slower than the generation itself.

### Fig 31 · 0:46
**How little actually crosses the network**
- [HEAD] Bytes on the wire, for one full turn
- [PROSE] Up, once
- [sub2] about 4 KB of prompt
- [PROSE] Down, 500 frames
- [sub] about 22 KB in total
- [PROSE] Up, during generation
- [sub2] nothing at all
- [PROSE] Tiny amounts, both ways. The network was never the constraint; it carries a few kilobytes while the server moves terabytes internally. That contrast is worth holding. A 500-token answer costs about 22 kilobytes of network and about 70 terabytes of memory traffic inside the machine. The slowness you feel has nothing to do with your connection.
> CAPTION: Two numbers seven orders of magnitude apart. Blaming the network for a slow answer is almost always wrong.

### Fig 32 · 0:46
**Two different things called re-sending**
- [HEAD] Two things that both get called re-sending
- [LABEL] Within one answer
- [sub] nothing is re-sent.
- [sub] The server holds the state.
- [LABEL] Between two turns
- [sub] everything is re-sent.
- [sub] The server holds nothing.
- [PROSE] While an answer is streaming, your device sends nothing and the server keeps the conversation in its cache from one token to the next. When you type your next message, that is a brand new request, and it carries the entire conversation again, because the request is the only thing the server is given. The cache may still be warm from last time, which makes processing that repeat cheap. But the text still travels, every turn. Confusing these two is what makes the whole picture hard to hold. One is per token and costs nothing; the other is per turn and costs everything.
> CAPTION: Per token, nothing repeats. Per turn, everything does. Almost every misunderstanding about how this works comes from mixing the two.

### Fig 33 · 0:46
**Two things the cache does**
- [HEAD] The same cache, doing two quite different jobs
- [LABEL] During a turn
- [sub] it grows.
- [sub] One new entry per token, no lookup.
- [LABEL] At the start of a turn
- [sub] it is searched.
- [sub] Either the prompt matches, or it does not.
- [PROSE] Inside an answer there is no such thing as a cache hit. Nothing is looked up; each token simply appends its keys and values to the end. The lookup happens once, when a new request arrives. The server asks: do I already hold keys and values for the beginning of this prompt? If yes, those tokens skip prefill entirely. That is a cache hit, and it is what people mean by a warm cache. Two jobs, two different moments. Confusing them makes the word cache do too much work.
> CAPTION: Growing and being searched are different operations at different times. Only the second one can hit or miss.

### Fig 34 · 0:46
**What is actually in the cache**
- [HEAD] The cache does not hold text, and it does not hold answers
- [sub] the words: kept in a database
- [sub] the keys and values: kept on the GPU
- [PROSE] For every token the model has processed, it worked out two vectors: a key and a value. Those are what later tokens attend to, and those are what the cache holds. They are not the token. They are the model's processed form of it, in the context it appeared in, and producing them is exactly what prefill does. So a cache hit does not save you from sending the text. It saves the server from turning that text into keys and values a second time.
> CAPTION: The distinction that makes everything else make sense. Text is cheap and travels every turn; keys and values are expensive and are what the cache is for.

### Fig 35 · 0:46
**Why a key and value can be reused**
- [HEAD] A token's key and value depend only on what came before it
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] t6
- [sub] t7
- [sub2] token 5's key and value are computed from these five
- [PROSE] Attention is causal, so nothing after token 5 can affect it. Its key and value are settled the moment token 5 is processed and never change again. That is the whole permission for caching. A value that could still change would be unsafe to keep; one that is settled forever is safe to keep for as long as there is room. It also tells you exactly when a cached value is still valid: when every token before it is the same as it was.
> CAPTION: Causality again, doing a third job. It forced decode to be sequential, it halved the score matrix, and here it is what makes caching sound.

### Fig 36 · 0:46
**Why a mismatch poisons everything after it**
- [HEAD] Change one token early, and everything after it becomes wrong
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] t6
- [sub] t7
- [sub2] cached
- [sub] t1
- [sub] XX
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] t6
- [sub] t7
- [sub2] arriving
- [sub2] differs here
- [PROSE] Token 3 has not changed, but its key and value were computed in a context that included token 2. With a different token 2, the old key and value for token 3 are simply wrong. So the match cannot skip over a difference and pick up again. Everything from the first mismatch onward has to be recomputed, identical or not. That is why it is a prefix rule and not a search for matching pieces.
> CAPTION: The reason the rule is so unforgiving. It is not a design choice; it follows from what a key and value are.

### Fig 37 · 0:46
**The projection is fixed, so where does the dependence come from?**
- [sub] key = that token's vector x W_K
- [PROSE] W_K is fixed the moment training ends. It is the same matrix for every token, every position, every conversation and every user, forever. So the projection really is independent of context. Nothing about it changes because a different word appeared earlier.
- [HEAD] Which makes the obvious question a good one
- [sub] if the matrix is fixed, how can the key depend on earlier tokens?
- [PROSE] The answer is not in the matrix. It is in what gets multiplied by it. A fixed function of a changing input is a changing output. The next figures are about what that input actually is at each layer.
> CAPTION: A reasonable objection, and the answer turns entirely on one thing: which vector is being fed into the fixed matrix.

### Fig 38 · 0:46
**At layer 1 you are right**
- [HEAD] At layer 1, the input is just the token itself
- [sub] token 5's ID
- [HEAD] +
- [sub] position 5
- [sub] the vector fed to W_K
- [PROSE] Nothing in that depends on tokens 1 to 4. Change token 2 and this vector is bit-for-bit identical.
- [sub] so at layer 1, your reasoning is exactly right
- [PROSE] Token 5's key and value at layer 1 are a function of token 5 alone. They could be looked up in a table and would be correct in any sentence whatsoever. If a model had only one layer, the cache would not need a prefix rule at all. Any token whose ID and position matched would be reusable, wherever it appeared.
> CAPTION: Worth granting fully rather than glossing over. The independence is real, and it survives exactly one layer.

### Fig 39 · 0:46
**Attention mixes the earlier tokens in**
- [HEAD] What layer 1 hands upward at position 5
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] a weighted blend of all five
- [PROSE] Attention at position 5 produces a weighted average over positions 1 to 5. That blend is added back into the representation at position 5. So what comes out of layer 1 at position 5 is no longer a function of token 5 alone. It now carries something of every token before it. That is not a side effect. It is the entire purpose of the layer: to make each position's representation reflect its context.
> CAPTION: The step that breaks the independence, and the step the model exists to perform. You cannot have contextual representations and context-free keys at the same time.

### Fig 40 · 0:46
**Where the dependence actually enters**
- [HEAD] The same fixed matrix, a different vector going into it
- [PROSE] layer 1
- [sub] embedding + position
- [sub] W_K
- [sub] key
- [PROSE] layer 2
- [sub] layer 1's output here
- [sub] W_K
- [sub] key
- [PROSE] W_K is the same matrix in both rows. The vector it multiplies is not. By layer 2 the input already contains information from tokens 1 to 5, so the key it produces does too. And layer 3's input contains layer 2's mixing, and so on. Across 80 layers, position 5's representation is blended with the earlier positions 80 times over. By the top it is thoroughly contextual. The dependence enters through the residual stream, never through the weights.
> CAPTION: The precise answer to the objection. Fixed function, changing input. The weights never learn anything about your sentence; the vector arriving at them already knows.

### Fig 41 · 0:46
**Measured on a small transformer**
- [HEAD] Change token 2, then measure token 5's key at each layer
- [PROSE] layer 1
- [sub] 0.000000
- [sub2] identical
- [PROSE] layer 2
- [sub] 3.538930
- [sub2] different
- [PROSE] layer 3
- [sub] 16.746760
- [sub2] different
- [PROSE] layer 4
- [sub] 20.102747
- [sub2] different
- [PROSE] A four-layer transformer, built and run for this figure: causal attention, a feed-forward block, residual connections. Only token 2 was altered. Layer 1 does not move at all, to the last bit. Layer 2 does, and the difference grows with depth as the mixing compounds. The pattern is what matters, not the magnitudes, which depend on the random weights used.
> CAPTION: Not an argument from authority. A four-layer model was run twice with one token changed, and layer 1's key was identical to the last bit while every layer above it moved.

### Fig 42 · 0:46
**Why context-dependent keys are the point**
- [HEAD] The same word, two sentences, two different keys
- [sub] the
- [sub] river
- [sub] bank
- [sub2] a key that leans toward water
- [sub] the
- [sub] savings
- [sub] bank
- [sub2] a key that leans toward money
- [PROSE] Identical token, identical position, identical W_K. Above layer 1 the two keys are different, because the vectors going into W_K are different. This is the same fact seen from the other side, and it is the reason the model can tell the two sentences apart at all. A model whose keys really were independent of context would be unable to disambiguate anything. The property you spotted, if it held all the way up, would make the model useless.
> CAPTION: The objection and the capability are the same phenomenon. Keys have to depend on context for the model to work, and that dependence is exactly what makes the prefix rule necessary.

### Fig 43 · 0:46
**Why layer 1 surviving does not rescue the cache**
- [HEAD] So could the cache keep layer 1 and throw away the rest?
- [PROSE] layer 1, still valid
- [sub2] 1.25% of the prefill work
- [PROSE] layers 2 to 80, invalid
- [sub] 98.75%, all of it recomputed
- [PROSE] In principle yes, for the positions whose token did not change. In practice it buys almost nothing, because one layer out of eighty is a rounding error. And to compute layer 2 you need layer 1's attention output, which means running layer 1's attention anyway. The saving is smaller still. So serving systems treat a prefix mismatch as invalidating everything from that point, which is correct for layers 2 upward and not worth an exception for layer 1.
> CAPTION: Your observation is correct and the engineering conclusion is unchanged. One layer in eighty is not worth the bookkeeping.

### Fig 44 · 0:46
**A cache hit is a prefix match**
- [HEAD] The prompt that arrives, and what the server already holds
- [sub2] arriving
- [sub] system
- [sub] tools
- [sub] history
- [sub] new
- [sub2] cached
- [sub2] the first difference
- [PROSE] The match runs from the front and stops at the first token that differs. Everything to the left is a hit; everything from that point on has to be prefilled. It cannot resume after a mismatch. Above the first layer a token's keys and values depend on every token before it, so once the sequences diverge nothing further can be reused. For a follow-up question: 906 of 911 tokens match, so only your 5 new words are prefilled. A hit rate of 99.5%, and almost all of it is text you never wrote.
> CAPTION: Front to back, stopping at the first difference. That one rule explains every warm and cold case below.

### Fig 45 · 0:46
**Words in common are not a cache hit**
- [HEAD] Four words in common, and not one of them helps
- [sub2] cached
- [sub] What
- [sub] is
- [sub] the
- [sub] capital
- [sub] of
- [sub] France
- [sub] ?
- [sub2] arriving
- [sub] Tell
- [sub] me
- [sub] the
- [sub] capital
- [sub] of
- [sub] France
- [sub] please
- [sub2] Words appearing in both: the, capital, of, France. Four of them.
- [sub] tokens matched from the front: 0
- [PROSE] The very first token differs, so the match ends at position zero. Everything shared sits behind that difference and is worthless, however much of it there is. A cache hit is not about words in common. It is about the sequence being identical from the beginning, in order, with nothing changed. This is the single most common misunderstanding about prompt caching.
> CAPTION: If you take one thing from this part, take this. Shared vocabulary counts for nothing; only a shared beginning counts.

### Fig 46 · 0:46
**The whole rule, in one line**
- [sub] compare from token 1, stop at the first difference
- [PROSE] Everything before that point is a hit and is reused. Everything from that point onward is a miss and must be prefilled.
- [HEAD] Which means the useful question is never how similar, but how identical, and from where
- [PROSE] Two prompts sharing a long opening and diverging at the end: almost all hit. Two prompts differing in the first word and identical thereafter: no hit at all. This is why the order of a prompt matters as much as its contents, and why the stable parts belong at the front.
> CAPTION: Everything in the rest of this part is this sentence applied to a particular case.

### Fig 47 · 0:46
**What warm and cold actually mean**
- [HEAD] The same question, two states of the cache
- [PROSE] Warm, a minute later
- [sub2] 906 of 911 already held
- [sub2] prefill 5 tokens
- [PROSE] Cold, a day later
- [sub2] 0 of 1,032 held
- [sub] prefill 1,032 tokens
- [sub] 206 times the work
- [PROSE] Identical question, identical model, identical hardware. The only difference is whether the blocks from last time are still resident. Warm means they are. Cold means they were evicted to make room for somebody else, and the keys and values stopped existing. The text survived in a database. Keys and values are not text; they are the model's processed form of it, and rebuilding them is exactly what prefill does.
> CAPTION: Not a vague sense of readiness. It is a precise question with a number attached: how many of the arriving tokens already have keys and values on this machine.

### Fig 48 · 0:46
**Time t, the first question**
- [HEAD] Time t: you ask the first question
- [sub2] arriving
- [sub] system
- [sub] tools
- [sub] your question
- [sub2] in the cache
- [sub2] nothing that matches this conversation
- [sub] hit 0 · prefill all 777 tokens
- [PROSE] Nothing of yours has been seen before, so every token is processed from scratch. This is the expensive case, and it is unavoidable the first time. One caveat: the system prompt and tools are identical for every user of this service, so on a busy machine they are very likely already cached from somebody else's request. Held aside, that leaves your seven tokens as the only genuinely new work.
> CAPTION: The cold case, and the only one where nothing at all can be reused. Even here the shared preamble is usually already warm.

### Fig 49 · 0:46
**Case A: you continue the chat**
- [HEAD] One minute later, continuing the same conversation
- [sub2] arriving
- [sub] system
- [sub] tools
- [sub] question 1
- [sub] answer 1
- [sub] new
- [sub2] in the cache
- [sub] hit 784 · prefill 4 tokens
- [PROSE] The answer the model produced a minute ago was itself cached as it was generated, so the whole history matches and only your four new words are new. This is the best case and the most common one. It is why a conversation stays quick as long as you keep typing.
> CAPTION: A perfect prefix. Note that the model's own previous answer is part of the cached prefix, because it was cached as it was written.

### Fig 50 · 0:46
**Case B: the same question, one word changed**
- [HEAD] One minute later, almost the same question
- [sub2] cached
- [sub] What
- [sub] is
- [sub] the
- [sub] capital
- [sub] of
- [sub] France
- [sub] ?
- [sub2] arriving
- [sub] What
- [sub] is
- [sub] the
- [sub] capital
- [sub] of
- [sub] Japan
- [sub] ?
- [sub2] diverges here
- [sub] hit 775 · prefill 2 tokens
- [PROSE] A brand new question, not a follow-up, and it still lands a hit: the preamble matches and so do the first five words, because they are identical and in the same places. Only Japan and the question mark are new. You did not plan this and there is no way to arrange it deliberately. It happens because questions of the same shape genuinely start the same way.
> CAPTION: A partial hit in the middle of your own sentence. The rule does not care that this is a different conversation, only that the tokens are identical from the front.

### Fig 51 · 0:46
**Case C: the same words, in a different order**
- [HEAD] One minute later, the same words rearranged
- [sub2] cached
- [sub] What
- [sub] is
- [sub] the
- [sub] capital
- [sub] of
- [sub] France
- [sub] ?
- [sub2] arriving
- [sub] Tell
- [sub] me
- [sub] the
- [sub] capital
- [sub] of
- [sub] France
- [sub] please
- [sub2] diverges at the very first token
- [sub] hit 770 · prefill 7 tokens
- [PROSE] Four of the seven words are shared, including the entire phrase the capital of France. None of it counts, because the first token is different. The 770 that did hit are the system prompt and tools, which are identical for everyone. Your own words contributed nothing. Compare this with case B: the same seven-token question, one matching 5 and the other matching 0, decided entirely by which word came first.
> CAPTION: Case B and case C share the same number of words with the original. One is a near-total hit and the other is nothing.

### Fig 52 · 0:46
**The three cases, on your words alone**
- [HEAD] Your seven tokens only, with the shared preamble set aside
- [PROSE] A continue the chat
- [sub2] 7 / 7
- [sub2] all of it, plus the whole history
- [PROSE] B France to Japan
- [sub2] 5 / 7
- [PROSE] C same words, reordered
- [sub2] 0 / 7
- [PROSE] Measured against the whole prompt all three look excellent, at 99.1% or better, because the 770-token preamble dominates and always matches. That number flatters everything and hides the part you control. Measured against your own words the three cases are completely different, and the difference is decided by where the first divergence falls.
> CAPTION: Two ways of quoting the same hit rate. The flattering one is the one usually reported, so it is worth knowing what it is hiding.

### Fig 53 · 0:46
**A day later: what survives and what does not**
- [HEAD] One day later, the same follow-up as case A
- [sub2] arriving
- [sub] system
- [sub] tools
- [sub] question 1
- [sub] answer 1
- [sub] new
- [sub2] in the cache
- [sub2] evicted overnight
- [sub] hit 770 · prefill 18 tokens
- [PROSE] Your conversation is gone, so its history has to be turned back into keys and values from the text, which is what prefill is. The preamble is probably still there. Thousands of other conversations share those exact 770 tokens, so on a busy machine somebody has kept them warm for you. That only helps if your request lands on the same machine, which is why serving systems route requests by which machine already holds their prefix.
> CAPTION: The shared preamble usually survives because it is shared. Your own conversation does not, because nobody else was keeping it alive.

### Fig 54 · 0:46
**Why a minute is warm and a day is not**
- [HEAD] The cache is a fixed pool that everyone is competing for
- [sub] one machine's cache memory
- [sub2] yours are the three on the left; the rest belong to other people
- [PROSE] When a new request needs room, the least recently used blocks are dropped. Nothing is on a timer; it is pure pressure. So a minute later, on a quiet machine, your blocks may still be there. A minute later on a very busy one, they may already be gone. A day later they are gone on any machine, because a day of other people's conversations will have cycled through that pool many times over. Providers quote a nominal lifetime, often a few minutes, but it is a guideline about typical load rather than a guarantee.
> CAPTION: Eviction is driven by demand for the space, not by elapsed time. That is why warmth is likely rather than certain, and why it degrades gracefully rather than expiring.

### Fig 55 · 0:46
**What a cache hit saves, and what it does not**
- [HEAD] A hit changes one phase and leaves the other untouched
- [PROSE] Prefill
- [sub] skipped, for every matched token
- [PROSE] Decode
- [sub] identical, every token still reads all 140 GB
- [PROSE] Caching is entirely a prefill optimisation. It cannot make the answer come out faster once it has started, because generating a token never depended on how the context was assembled. So a warm cache improves time to first token and does nothing at all for time per output token. Those are the two numbers a user feels, and this touches only one of them. Which matches the experience: a warm follow-up starts sooner, and then streams at exactly the same speed as a cold one.
> CAPTION: Worth being precise, because caching is often described as making the model faster. It makes it start sooner, which is a different claim.

### Fig 56 · 0:46
**Why the front of the prompt is the expensive place to edit**
- [HEAD] Change one token at the very front
- [sub] edit
- [sub] rest of the system prompt
- [sub] tools
- [sub] everything after
- [sub2] the match ends here
- [PROSE] Because the match runs from the front, a difference at position five ends it at position five. Nothing after that point can be reused, however identical it is. So editing the system prompt does not cost a little. It invalidates every cached conversation on the machine at once, for every user, because they all share that prefix. 206 times the prefill work, from a one-token change. Which is why serving systems put the most stable text first and the most variable text last, and why operators are careful about editing a system prompt in production.
> CAPTION: A practical consequence that falls straight out of prefix matching. Order matters: stable text at the front, variable text at the back.

### Fig 57 · 0:46
**How you can tell it streams rather than buffers**
- [HEAD] Two things you can check yourself
- [LABEL] Text appears steadily
- [sub] at a roughly constant rate,
- [sub] not all at once
- [LABEL] Stopping mid-answer works
- [sub] and the server stops
- [sub] generating, saving compute
- [PROSE] If the answer were finished before being sent, it would arrive in one piece and pressing stop halfway through would save nothing. Both observations point the same way: the tokens leave as they are made. There is a non-streaming mode, where the caller waits and receives the whole answer at once. It is the same generation underneath; only the delivery differs. A chat window uses streaming because the first token can then be shown in under a second, rather than after the whole answer is complete.
> CAPTION: Two observable behaviours that would both be impossible if the answer were assembled first and sent afterwards.

### Fig 58 · 0:46
**A token is sent the moment it is made**
- [HEAD] One token, in three places, moments apart
- [sub] made on the server
- [sub] in flight
- [sub] on your screen
- [sub2] at time t
- [sub2] one one-way trip
- [sub2] at t + 65 ms
- [PROSE] The token is not held back. The instant it exists it is written to the open connection, and it appears in your window one one-way trip later. So the two things happen at once from any human point of view. There is no phase where the answer is complete on the server and not yet on your screen. The only exception is a non-streaming call, where the caller has asked for the finished answer in one piece. Same generation underneath; different delivery.
> CAPTION: Generation and display are the same event, offset by a network trip. Nothing waits for the answer to finish.

### Fig 59 · 0:46
**Why the network delay does not slow the answer**
- [HEAD] The lag is the same for every token, so it does not slow the stream
- [sub2] made
- [sub2] seen
- [sub2] each arrow is one one-way trip, and they are all the same length
- [PROSE] Because the offset never grows, the spacing between tokens on your screen matches the spacing between tokens on the server exactly. You read at the rate the model generates. What the trip delays is only the beginning. It is part of the time to first token, and it is tens of milliseconds against a prefill measured in hundreds. Had the server buffered the whole answer, a five-hundred-token reply would show nothing for about fifteen seconds and then appear at once. That is the difference you would notice.
> CAPTION: A constant offset shifts a stream without stretching it. This is why the answer feels smooth even from the other side of the world.

### Fig 60 · 1:57
**The route this series takes**
- [LABEL] One token, end to end
- [sub] router
- [sub] scheduler
- [sub] prefill
- [sub] KV transfer
- [sub] decode
- [sub] screen
- [PROSE] The series traces exactly this path. Each stage gets its own engineering problem and its own answer, and every term above becomes precise as we go. This video covers the ground underneath all of it: where the 30 milliseconds actually goes.
> CAPTION: Worth returning to. Most of what follows in later videos is an optimisation to one of these six boxes.


## The 30 millisecond puzzle
_A calculation that does not come out._

### Fig 61 · 2:41
**What counts as one operation**
- [HEAD] An operation is one piece of arithmetic
- [sub] one multiplication
- [sub] one addition
- [PROSE] That is all. Not a line of code, not a step of reasoning. One multiply, or one add, on two numbers. The unit is a floating-point operation, usually shortened to FLOP. Floating point just means the numbers can have a fractional part, which the model's weights certainly do. Counting them is how the size of a job is measured, in the same way distance is measured in metres.
> CAPTION: Deliberately small. When a figure later says a token costs 140 billion operations, it means 140 billion of these.

### Fig 62 · 2:41
**How to read a number like ten to the fifteen**
- [HEAD] Reading the big numbers
- [sub] 10^3
- [PROSE] thousand
- [sub] 10^6
- [PROSE] million
- [sub] 10^9
- [PROSE] billion
- [sub] 10^12
- [PROSE] trillion
- [sub] 10^15
- [PROSE] quadrillion The small raised number counts the zeros. Ten to the fifteen is a one followed by fifteen zeros, which is a thousand million million. Each step down this list is a thousand times the one above. The bars are drawn on a logarithmic scale, because on a normal scale the top four would be invisible. Only two of these matter here: a chip does about ten to the fifteen operations a second, and one token costs about ten to the eleven.
> CAPTION: Worth a moment, because the whole argument is a comparison between two of these and they are four steps apart.

### Fig 63 · 2:41
**A count and a rate are different things**
- [LABEL] A count
- [sub] how many operations a job needs
- [sub] no time in it at all
- [LABEL] A rate
- [sub] how many a chip does per second
- [sub] time is built in
- [sub] count / rate = seconds
- [PROSE] The two are written almost identically, FLOP and FLOPS, and confusing them is the single most common mistake in this subject. A useful test: if a sentence about performance does not survive being checked for units, one of the two is being used where the other belongs.
> CAPTION: The division in the middle is the entire calculation the next few figures perform.

### Fig 64 · 2:41
**The arithmetic finishes almost instantly**
- [PROSE] What the chip can do
- [sub] about 10^15 operations per second
- [PROSE] What one token needs
- [sub2] about 10^11 operations
- [sub] 10^11 / 10^15 = 0.1 milliseconds of arithmetic
- [PROSE] A quadrillion operations a second is a trillion in every millisecond. The arithmetic for one token takes a tenth of a millisecond. The budget is thirty milliseconds. On the arithmetic alone the chip could have finished three hundred more tokens in the time left over.
> CAPTION: Two numbers and a division. Everything in this video is an answer to why the remaining 29.9 milliseconds are not free.

### Fig 65 · 2:41
**Doing the division**
- [HEAD] Dividing powers of ten: subtract the exponents
- [sub] 10^11 operations / 10^15 operations per second
- [sub] = 10^(11 - 15) = 10^-4 seconds
- [sub] = 0.0001 seconds = 0.1 milliseconds
- [PROSE] A negative exponent means a fraction: ten to the minus four is one ten-thousandth. And the units work out. Operations divided by operations-per-second leaves seconds, which is what a duration should be. If they had not cancelled, something would be wrong.
> CAPTION: The whole puzzle is one division, so it is worth doing slowly. Checking that the units cancel is the habit that catches most errors in this subject.

### Fig 66 · 2:41
**Checking the units**
- [HEAD] What the units tell you
- [sub] operations
- [sub2] divided by
- [sub] operations per second
- [sub] seconds
- [PROSE] The word operations appears on the top and on the bottom, so it cancels, exactly as it would in a fraction. What is left is one over per-second, which is seconds. Try it the other way round and you get operations squared per second, which is not a duration and not anything else either. Any statement about performance that does not survive this test has something wrong with it.
> CAPTION: A test that costs five seconds and catches the most common class of error. Use it on every claim in this series, including the ones made here.

### Fig 67 · 3:29
**The gap, drawn to scale**
- [HEAD] Where the 30 milliseconds goes
- [sub2] arithmetic, under 1%
- [sub] something else, 99%
- [PROSE] Less than one percent of a decode step is spent doing mathematics. The chip is not slow and the model is not badly written. By the end of this video the other ninety-nine percent has a name, and the thirty milliseconds can be derived from just two hardware numbers, for any model on any chip.
> CAPTION: This bar is the thesis of the whole series. Everything later is an attempt to shrink the red part.

### Fig 68 · 2:58
**What three hundred times looks like**
- [HEAD] The gap, as a ratio
- [PROSE] arithmetic
- [sub2] 0.1 ms
- [PROSE] the budget
- [sub] 30 ms
- [sub] 30 / 0.1 = 300
- [PROSE] Three hundred times. Both bars are drawn to the same scale, which is why the first one is barely visible. Another way to say it: on the arithmetic alone, the chip could have produced three hundred tokens in the time it takes to produce one.
> CAPTION: Ratios stated in words are easy to nod along to. Drawn to scale, the same claim is much harder to skim past.

### Fig 69 · 3:29
**The same gap, as a percentage**
- [HEAD] The same gap, as a percentage
- [sub] everything that is not arithmetic
- [sub2] 0.33%
- [sub] 0.1 / 30 = 0.0033 = 0.33 percent
- [PROSE] A percentage is just a fraction written out of a hundred. A third of one percent is the sliver at the left edge, and it is the only part of the bar doing mathematics. The video says under one percent. The exact figure depends on the model and the chip, but the order of magnitude is not in doubt.
> CAPTION: Two ways of saying one thing, because a ratio and a percentage land differently on different readers.


## Two numbers, two different physics
_Why the gap exists and why it keeps widening._

### Fig 70 · 3:51
**Why a graphics processor, of all things**
- [HEAD] An ordinary processor: a few fast workers
- [sub2] each one clever, quick, and able to change task instantly
- [HEAD] A graphics processor: thousands of slow ones
- [sub2] each one plain, and all doing the same thing to different numbers
- [PROSE] Multiplying a vector by a matrix is millions of small multiplications with no dependencies between them. That is the one job the second picture is built for. The name is historical. Drawing pixels turned out to be the same shape of work as multiplying matrices, so the hardware built for one was already right for the other. It is a poor choice for anything with a chain of dependencies, which is exactly the weakness that shows up in decode later in this video.
> CAPTION: Not chosen for cleverness. Chosen because the workload is a vast number of identical, independent multiplications, which is the only thing this shape of chip is good at.

### Fig 71 · 3:51
**The arithmetic and the numbers are in different places**
- [LABEL] The chip
- [sub] does the arithmetic
- [sub] holds almost nothing
- [LABEL] The memory
- [sub] holds all 70 billion weights
- [sub] does no arithmetic
- [PROSE] These are two separate pieces of silicon with a bus between them. The weights live in the memory. The arithmetic happens on the chip. So every weight has to travel across that bus before it can be used. That journey, repeated for every weight on every token, is what this video is about.
> CAPTION: If they were in the same place there would be no memory wall and no need for this series.

### Fig 72 · 3:51
**Why computers use two states**
- [HEAD] Why two states, and not ten
- [sub] voltage high
- [sub] voltage low
- [sub2] call them 1 and 0
- [PROSE] A wire could in principle carry ten different voltage levels and hold a decimal digit. Nobody builds it that way, because telling ten levels apart reliably, billions of times a second, across a warm chip, is far harder than telling two apart. Two states tolerate noise. A signal that should be high can sag a long way and still be read correctly. So everything is built out of yes-or-no, and any other number has to be assembled from them.
> CAPTION: Not a mathematical preference. It is an engineering one, and the reason every quantity in this series is eventually counted in bits.

### Fig 73 · 3:51
**Bytes, and how many a model takes**
- [HEAD] A byte is eight bits, and a bit is one yes-or-no
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 1
- [sub2] one byte
- [HEAD] One weight takes two of them
- [sub2] sixteen bits is enough to store one weight to useful accuracy
- [sub] 70 billion weights x 2 bytes = 140 gigabytes
- [PROSE] A gigabyte is a billion bytes. So the model, written down, is a hundred and forty billion bytes: a file far too large to sit anywhere except in the memory. How many bits a weight gets is a real design choice, and shrinking it is the subject of a later video. Sixteen is the common default.
> CAPTION: This conversion, from a parameter count to a byte count, is used constantly from here on.

### Fig 74 · 3:51
**What bandwidth is**
- [sub] bandwidth = how many wires x how often each one carries a bit
- [PROSE] Bandwidth is not speed in the everyday sense. It is a width multiplied by a frequency.
- [HEAD] A narrow pipe, running fast
- [sub2] not much gets through
- [HEAD] A wide pipe, running steadily
- [sub2] far more, at the same clock
- [PROSE] Which is why memory gets faster mostly by getting wider, and why the memory sits packed physically against the chip: a wide connection needs an enormous number of wires and they cannot be long. The figure quoted for a modern chip is around three trillion bytes per second.
> CAPTION: Width times frequency. It explains both why memory is where it is and why it is hard to make much faster.

### Fig 75 · 3:51
**What per second means**
- [HEAD] A rate is an amount divided by a time
- [sub] bytes
- [sub2] per
- [sub] second
- [HEAD] So a rate times a time gives back an amount
- [sub] 3.35 TB/s x 0.03 s = about 100 GB moved in one token's budget
- [PROSE] Which is not quite the 140 gigabytes the model needs, and that gap is the whole story of this video in a single line of arithmetic. Every specification you will meet is one of these two shapes: an amount, or an amount per second. Keeping them apart is most of the skill.
> CAPTION: The multiplication runs the other way from the division in Part 3, and gives the same answer from the other side.

### Fig 76 · 3:51
**Latency and bandwidth are different things**
- [HEAD] Latency: how long one request takes
- [sub] ask
- [sub2] wait
- [sub] arrive
- [HEAD] Bandwidth: how many can be travelling at once
- [PROSE] These are independent. A wide slow pipe has high bandwidth and high latency; a narrow quick one has the reverse. You cannot make the memory low-latency, because the distance and the physics are what they are. What you can do is keep enough requests in flight that the pipe never runs dry.
> CAPTION: Confusing these two produces most of the wrong intuitions in this field. Hold them apart.

### Fig 77 · 3:51
**The two specifications that matter**
- [LABEL] Compute throughput
- [sub] floating-point operations
- [sub] per second
- [LABEL] Memory bandwidth
- [sub] bytes per second, between
- [sub] off-chip memory and the chip
- [PROSE] Producing a token needs both: fetch weights from memory, then multiply them against the input. If either channel is too slow, the other sits idle. Performance is set by whichever runs out first, never by an average of the two.
> CAPTION: Two independent resources. Almost every performance question in this series reduces to asking which of them a workload exhausts.

### Fig 78 · 4:36
**Why they scale differently**
- [HEAD] Compute scales with one thing
- [sub] transistor density
- [sub2] no hard ceiling reached yet
- [HEAD] Bandwidth is the product of three, each with its own physical limit
- [sub] signalling rate per pin
- [HEAD] x
- [sub] pins per stack
- [HEAD] x
- [sub] stacks per chip
- [PROSE] Pins can only switch so fast before signal integrity fails. Stacks need physical area on the package, and the package has edges. Every term is bounded by geometry or by physics. So one curve keeps climbing and the other is fighting three ceilings at once. The divergence is not a failure of engineering effort; it is built into what the two things are.
> CAPTION: This is the mechanism behind the memory wall. Compute has one lever and memory has three constrained ones.

### Fig 79 · 4:36
**Why memory is a separate chip**
- [HEAD] Why the memory is not on the chip
- [LABEL] Fast logic
- [sub] needs one kind of
- [sub] silicon process
- [LABEL] Dense storage
- [sub] needs a different one
- [LABEL] Nobody has made
- [sub] both work well on
- [sub] one piece of silicon
- [PROSE] A chip is optimised for one job. The process that makes fast switching transistors is not the process that packs the most storage into the least area. There is also simply not enough room. A hundred and forty gigabytes of storage will not fit on a piece of silicon the size of a postage stamp, at any price. So the memory sits on separate chips, as close as physically possible, joined by the widest bus that can be built. Close is not the same as on, and the difference is the memory wall.
> CAPTION: The wall is not a design oversight anybody could have avoided. It follows from what silicon can and cannot do.

### Fig 80 · 4:36
**Reading a specification**
- [HEAD] A specification sheet, and what each line is
- [PROSE] Memory capacity
- [sub] 80 GB
- [sub2] an amount
- [PROSE] Memory bandwidth
- [sub] 3.35 TB/s
- [sub2] a rate
- [PROSE] Peak compute
- [sub] 989 TFLOP/s
- [sub2] a rate
- [PROSE] Power draw
- [sub] 700 W
- [sub2] a rate
- [PROSE] Three of the four are rates and one is an amount. Confusing capacity with bandwidth is the single most common error when reading these. Capacity says whether the model fits at all. Bandwidth says how fast it can be read once it does. They are separate limits and a chip can fail either one.
> CAPTION: Every figure quoted in this series comes off a sheet like this. Knowing which line is an amount and which is a rate is enough to sort most claims.

### Fig 81 · 5:22
**The divergence, measured**
- [sub2] compute, x80
- [sub2] bandwidth, x17
- [sub2] 2012
- [sub2] 2022
- [PROSE] Top-tier server GPUs over one decade: floating-point throughput up about eighty times, off-chip bandwidth up about seventeen.
- [sub] 80 / 17 = a 4.7x divergence
- [PROSE] And the curves are still spreading.
> CAPTION: Schematic curves, real endpoints. A single decade moved the balance between the two resources by almost a factor of five.

### Fig 82 · 5:44
**The memory wall has a name and a date**
- [LABEL] Wulf and McKee, 1995
- [sub] more than twenty years before
- [sub] the transformer existed
- [LABEL] What changed
- [sub] not the hardware trend,
- [sub] the workload
- [PROSE] The gap was always there. What is new is a computation hungry enough for bytes that the gap became the dominant concern rather than one concern among many. Large language model inference is among the most byte-hungry workloads ever built.
> CAPTION: A useful piece of perspective: this is not an AI problem that hardware failed to anticipate. It is a long-standing architectural trend that AI happened to walk straight into.

### Fig 83 · 6:07
**The asymmetry everything else assumes**
- [LABEL] Arithmetic
- [sub] cheap
- [LABEL] Data movement
- [sub] expensive
- [PROSE] Every architectural decision in production inference, and every paper in this series, takes this sentence as given.
> CAPTION: If you remember one line from this video, this is the one. The rest is working out what it implies.


## What a transformer actually does
_The structure that makes inference byte-hungry._

### Fig 84 · 6:29
**Vectors and matrices**
- [HEAD] A vector is just a list of numbers
- [sub] 0.4
- [sub] -1.2
- [sub] 0.0
- [sub] 0.9
- [sub] 0.3
- [sub] -0.5
- [sub] 1.1
- [sub] 0.2
- [sub2] eight numbers, written in a row
- [HEAD] A matrix is a grid of them
- [sub2] four rows of eight
- [PROSE] That is the whole of the vocabulary. A vector holds one token's state; a matrix holds a block of the model's weights. The model is a few hundred matrices, and running it is multiplying vectors by them.
> CAPTION: No linear algebra background is needed beyond this. The only operation that follows is multiply-and-add, which is the next figure.

### Fig 85 · 6:29
**What a matrix multiply does**
- [HEAD] Multiplying a vector by a matrix
- [sub] in
- [HEAD] x
- [HEAD] =
- [sub] out
- [PROSE] Each row of the matrix meets the input vector: multiply the pairs, add the results, and that single number is one entry of the output. Do that for every row and you have the whole output vector. Twenty weights are drawn here, so twenty multiplications and twenty additions. This is the only heavy operation in the entire model. Everything else is a rounding error beside it.
> CAPTION: The pattern from the very first part, scaled up. Every weight is touched exactly once, which is the fact the operation count later depends on.

### Fig 86 · 6:29
**From text to vectors**
- [LABEL] Text
- [sub] a 500-word prompt
- [LABEL] Tokens
- [sub] roughly 600 to 800
- [LABEL] Vectors
- [sub] several thousand wide
- [PROSE] Tokens are the units the model works with, on average a little smaller than words. Common words are usually one token; rare words break into several. Each token is then mapped to a fixed-length vector encoding both which token it is and where in the sequence it sits. That vector is what the model actually processes; the text itself never appears again.
> CAPTION: Two conversions, and neither is a calculation. The tokeniser splits text by table lookup; the embedding step then reads a row per token. From here on there is no text left in the system, only arrays of numbers, and everything downstream is linear algebra.

### Fig 87 · 6:29
**A token ID is a row number**
- [HEAD] The embedding table: one row per token in the vocabulary
- [sub2] 0
- [sub2] 1
- [sub2] 2
- [sub2] ...
- [sub2] 4271
- [sub2] 4096 numbers
- [sub2] ...
- [sub2] 127998
- [sub2] 127999
- [sub] ID 4271
- [sub] that row
- [PROSE] The tokeniser turns a piece of text into an integer. That integer is not fed into a function; it is a row number. The model goes to that row of the table and copies it out. Nothing is calculated. No multiplication, no addition, no arithmetic of any kind. The whole operation is a memory read at a computed address.
> CAPTION: This is what a lookup means. The table is a learned parameter like any other, but reaching into it costs zero floating-point operations.

### Fig 88 · 6:29
**Written as a multiply, never done as one**
- [HEAD] Textbooks write it as a matrix multiply
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub2] a one-hot vector: 128,000 entries, exactly one of them a 1
- [sub] one-hot x embedding table = row 4271
- [PROSE] Which is true, and also a description nobody implements. Every entry of that vector except one is zero, and anything multiplied by zero contributes nothing to the sum.
- [sub] 128,000 multiplications, 127,999 of them by zero
- [PROSE] So the arithmetic is skipped entirely and the implementation indexes straight into the table. The mathematics says multiply; the hardware does a gather. That distinction matters for the rest of this series, because the two have completely different costs: one is measured in operations, the other in memory accesses.
> CAPTION: Worth internalising as a habit. Several things in a transformer are written as dense linear algebra and executed as something much cheaper.

### Fig 89 · 6:29
**The same shape, read two opposite ways**
- [HEAD] Two matrices of identical shape, 128,000 x 4,096
- [PROSE] Input embedding
- [sub2] a 200-token prompt
- [sub2] 0.15%
- [PROSE] Output projection
- [sub2] every single token
- [sub] 100%
- [PROSE] Bytes moved
- [sub2] 1.6 MB
- [sub] 1.05 GB, again for the next token
- [PROSE] The input embedding touches 200 rows out of 128,000 and never looks at the rest. The output projection has to score every token in the vocabulary, so it reads all of them, every time. Zero floating-point operations against 1.05 billion, for the same quantity of stored weights. Some models share one set of weights between the two. Even then the reading is not shared: one end gathers a handful of rows, the other end streams all of them.
> CAPTION: A genuine exception to every token reads every weight. The embedding table is one of the largest single matrices in the model and contributes almost nothing to the traffic on the way in.

### Fig 90 · 6:40
**Why position has to be encoded**
- [HEAD] The same words, a different order
- [sub] the
- [sub] dog
- [sub] bit
- [sub] the
- [sub] man
- [sub] the
- [sub] man
- [sub] bit
- [sub] the
- [sub] dog
- [PROSE] Identical tokens, entirely different meaning. So the model cannot treat the input as an unordered bag; where each token sits has to be part of what it is. Each token's vector therefore carries both which token it is and where in the sequence it appeared, either added in at the start or applied inside attention. Without it, both lines above would produce the same answer.
> CAPTION: A small figure for a fact that is easy to state and easy to forget: the vectors alone do not say what order anything came in.

### Fig 91 · 7:15
**A layer does two things**
- [LABEL] One transformer layer
- [LABEL] Attention
- [sub] moves information between tokens
- [LABEL] Feed-forward network
- [sub] transforms each token alone
- [sub2] attention is the only place where one token's representation can affect another's
- [sub2] the feed-forward step treats every position independently
- [PROSE] A modern large model stacks 60 to over 100 of these. The output of one layer is the input to the next, and every layer has its own separate set of weights.
> CAPTION: The division of labour is worth holding: one operation mixes across positions, the other does not. Nearly every optimisation later treats them separately.

### Fig 92 · 7:15
**Attention: query, key, value**
- [LABEL] Query
- [sub] what this token
- [sub] is looking for
- [LABEL] Key
- [sub] what it can offer
- [sub] to other tokens
- [LABEL] Value
- [sub] what it contributes
- [sub] when matched
- [PROSE] Each token's vector is projected into three separate vectors. Every query is then compared against every key, producing a matrix of similarity scores. Those scores are used to blend the values into an updated vector for each position. That is how context from one token reaches another.
> CAPTION: Three roles from one vector. The matrix of scores in the middle is small here and becomes the central object of the third video.

### Fig 93 · 7:15
**What a weighted average is**
- [HEAD] A plain average counts everything equally
- [sub] 10
- [sub] 20
- [sub] 30
- [sub] (10 + 20 + 30) / 3 = 20
- [HEAD] A weighted average lets some count more than others
- [sub] 10
- [sub2] x 0.5
- [sub] 20
- [sub2] x 0.3
- [sub] 30
- [sub2] x 0.2
- [sub] 5 + 6 + 6 = 17
- [PROSE] The weights add up to one, so the answer stays inside the range of the values. Here the first value counts for half, so the result is pulled down towards it. Change the weights and the answer changes without any of the values changing. That separation, between what the values are and how much each one counts, is exactly what attention does.
> CAPTION: One idea, and the next figure is nothing but this applied to a sequence of tokens.

### Fig 94 · 7:15
**Attention, in one sentence**
- [HEAD] Attention is a weighted average of the other tokens
- [sub] this token asks
- [PROSE] the
- [sub2] 0.05
- [PROSE] cat
- [sub2] 0.62
- [PROSE] sat
- [sub2] 0.28
- [PROSE] down
- [sub2] 0.05
- [sub2] how much each earlier token counts, adding to 1.00
- [sub] the blended result
- [PROSE] The values being blended are the earlier tokens' vectors. The weights are worked out by comparing this token's query against each of their keys. So query, key and value are three roles in one weighted average: the query asks, the keys decide the weights, and the values are what gets averaged. Weights are illustrative. What is not illustrative is that they always add to one.
> CAPTION: The three-letter names stop being mysterious once you see they are the three parts of a weighted average: who is asking, how much each counts, and what is being averaged.

### Fig 95 · 7:15
**What context means**
- [HEAD] Context is everything the model can see right now
- [sub] the conversation so far
- [sub] the newest token
- [PROSE] A token's meaning depends on what came before it. The word bank means one thing after river and another after savings, and attention is how that dependence is computed. Context length is how many tokens the model can attend over. Beyond that limit the earliest tokens fall out and cannot influence anything. Every token in the context has to be looked at for every new token produced. That is why a long conversation is not just a longer input; it is more work per token.
> CAPTION: The last line is the one that matters later. Context length is not a storage limit, it is a recurring cost.

### Fig 96 · 7:15
**What a layer produces**
- [LABEL] One layer
- [sub] vectors in
- [sub] mix, then transform
- [sub] vectors out
- [PROSE] Same count, same width. A layer does not shorten or lengthen anything; it replaces each token's vector with a better one. Better means carrying more of what the surrounding text implies. The first layers pick up local patterns, and the later ones work with what the earlier ones produced. Because input and output have the same shape, layers can simply be stacked.
> CAPTION: The shape-preserving property is what makes depth possible at all. Eighty layers is eighty rounds of the same refinement.

### Fig 97 · 7:15
**The picture that seems natural**
- [HEAD] One natural picture: computed once, then carried upward
- [sub] embedding
- [sub] W_Q, W_K, W_V
- [sub] Q, K, V
- [sub] layer 2
- [sub] layer 3
- [sub] layer 4
- [sub] layer 5
- [PROSE] It is a reasonable reading. The projections are fixed after training, the embedding is computed once, so why would you do the multiplication more than once? But that is not what happens, and the reason is worth following because it explains the shape of the cache formula. Every layer has its own W_Q, its own W_K and its own W_V, and computes Q, K and V afresh.
> CAPTION: Worth stating clearly before correcting it, because it is the reading the previous figures could easily leave you with.

### Fig 98 · 7:15
**What actually happens**
- [HEAD] Each layer owns its own three matrices
- [LABEL] layer 1
- [sub] W_Q layer 1
- [sub] W_K layer 1
- [sub] W_V layer 1
- [LABEL] layer 2
- [sub] W_Q layer 2
- [sub] W_K layer 2
- [sub] W_V layer 2
- [LABEL] layer 3
- [sub] W_Q layer 3
- [sub] W_K layer 3
- [sub] W_V layer 3
- [LABEL] layer 4
- [sub] W_Q layer 4
- [sub] W_K layer 4
- [sub] W_V layer 4
- [PROSE] Eighty layers means eighty separate W_Q matrices, eighty W_K and eighty W_V, all learned independently during training and all different from one another. So the multiplication happens eighty times per token, not once, each time against a different matrix and a different input. They are not shared and they are not reused. Layer 40's W_K has nothing to do with layer 39's.
> CAPTION: The correction, and the reason the earlier figures said above the first layer rather than after the embedding.

### Fig 99 · 7:15
**What travels between layers**
- [HEAD] One thing flows upward; three things are made fresh at every stop
- [sub] the residual stream: one vector per token, 8,192 numbers wide
- [sub] layer 1 makes Q, K, V
- [sub] layer 2 makes Q, K, V
- [sub] layer 3 makes Q, K, V
- [sub] the residual stream, updated
- [PROSE] The stream is what carries information from layer to layer. Q, K and V are not carried; they are made from the stream, used inside that layer, and discarded. Which is why the stream keeps the same width all the way up, and why layers can simply be stacked. Keys and values are the one partial exception: they are kept, but only for the cache, and each layer keeps its own.
> CAPTION: The residual stream is the only thing that flows. Everything else is manufactured and consumed within a single layer.

### Fig 100 · 7:15
**How many of these there are**
- [HEAD] Counting the attention matrices in one model
- [PROSE] W_Q
- [sub] 80 of them, one per layer
- [PROSE] W_K
- [sub] 80 of them, one per layer
- [PROSE] W_V
- [sub] 80 of them, one per layer
- [PROSE] W_O
- [sub] 80 of them, one per layer
- [sub2] total
- [sub] 320 attention weight matrices
- [PROSE] Plus the feed-forward matrices, three more per layer, which is another 240. None of them is shared between layers. That is why a model's parameter count grows in direct proportion to its depth. And it is why reading the weights once per token means reading all 560 of these, every token.
> CAPTION: The number that makes depth expensive. Eighty layers is not eighty repetitions of the same work; it is eighty different sets of weights to fetch.

### Fig 101 · 7:15
**The parameter count settles it**
- [HEAD] Add it up and check against the advertised size
- [PROSE] attention, per layer
- [sub] 151.0 M
- [PROSE] feed-forward, per layer
- [sub] 704.6 M
- [PROSE] one layer
- [sub] 855.6 M
- [PROSE] x 80 layers
- [sub] 68.5 B
- [PROSE] plus embedding and output head
- [sub] 2.1 B
- [sub2] total
- [sub] 70.6 B
- [sub2] advertised: 70 B
- [PROSE] It lands, to within rounding. Now do the same sum assuming W_Q, W_K and W_V exist only once for the whole model rather than once per layer. You get 63.9 billion, and the model would be six billion parameters short of what it is. So the per-layer answer is not a design opinion. It is the only version that adds up.
> CAPTION: Shapes taken from a published 70-billion-parameter model. The arithmetic is the evidence: the count only works if every layer has its own three matrices.

### Fig 102 · 7:15
**Why stack so many layers**
- [HEAD] Depth, one layer at a time
- [sub] after 1 layer
- [sub2] a token knows its neighbours
- [sub] after 10
- [sub2] it knows the phrase it sits in
- [sub] after 40
- [sub2] it knows the sentence
- [sub] after 80
- [sub2] it can carry the whole passage
- [PROSE] A rough picture rather than a measured one: nobody can point at layer 40 and read off what it knows. What is certain is that each layer can only build on what the one below it produced. The cost is linear in depth. Eighty layers means eighty times the weights and eighty times the reading, for every single token.
> CAPTION: The middle column is intuition, not measurement, and is flagged as such. The last line is exact and is what the byte count later depends on.

### Fig 103 · 9:08
**How the model gets back to words**
- [HEAD] The last step: from a vector to a word
- [sub] final vector
- [sub] score every token
- [sub] pick one
- [sub2] 4,096 numbers
- [sub2] 128,000 numbers
- [sub2] 1 token
- [PROSE] The vector coming out of the last layer is not text and not a word. It is turned into a score for every token in the vocabulary by one more matrix multiply. Then softmax turns those scores into shares, and one token is drawn. That token is appended to the input, and the entire eighty-layer journey begins again for the next one.
> CAPTION: Closes the loop opened in Part 1. Everything between the first embedding lookup and this step is arithmetic on arrays of numbers.

### Fig 104 · 9:08
**Where the parameters live**
- [LABEL] Every layer is parameterised by weight matrices
- [sub] query
- [sub] key
- [sub] value
- [sub] combine
- [sub] feed-forward, first
- [sub] feed-forward, second
- [PROSE] Six matrices per layer, times sixty to a hundred layers. These weights are what the model learned during training. They are the model. After the last layer, the final vector at the last position is multiplied against a vocabulary projection that scores every possible next token, and one is picked. That whole journey is one forward pass.
> CAPTION: The count of these matrices, and their size, is the number everything else in this video divides by or multiplies against.


## The weights, and what they cost to move
_From a parameter count to a byte count._

### Fig 105 · 9:30
**140 gigabytes, moved every pass**
- [sub] memory = parameter count x bytes per parameter
- [PROSE] 70 billion parameters
- [sub] x 2 bytes
- [sub2] = 140 GB, in 16-bit precision
- [PROSE] That is the entire model, sitting in the chip's off-chip memory pool. It does not change between requests. It is the model.
- [HEAD] What HBM physically is
- [sub] die
- [sub] die
- [sub] die
- [sub] GPU die
- [sub2] Stacks of memory chips bonded beside
- [sub2] the GPU on the same package, joined by
- [sub2] a very wide parallel bus.
- [PROSE] Every forward pass reads all 140 GB out of HBM and moves them across that bus into the arithmetic units. Every single time.
> CAPTION: High bandwidth memory is close and wide, but it is still off the compute die, and that trip is what the rest of the video is about.

### Fig 106 · 9:30
**Three places, three speeds**
- [HEAD] Reading 140 gigabytes from each place
- [PROSE] From a disk
- [sub2] about 20,000 ms
- [PROSE] From the memory beside the chip
- [sub2] about 42 ms
- [PROSE] From the chip's own memory
- [sub2] it does not fit
- [PROSE] Roughly five hundred times between the first two rows. That is why the model is loaded into the memory beside the chip and stays there. The third row is not slow, it is impossible: the chip holds a few hundred kilobytes of fast memory, not a hundred and forty gigabytes. Disk figures are approximate and vary widely by hardware. The gap between the tiers does not.
> CAPTION: The disk row explains why start-up is slow and why nobody streams weights from storage. After load, it never appears again.

### Fig 107 · 9:30
**What high bandwidth memory is**
- [LABEL] One package
- [sub] memory
- [sub] memory
- [sub] the processing chip
- [sub] memory
- [sub] memory
- [sub2] stacks of memory bonded millimetres from the chip, on the same slab
- [PROSE] This is what high bandwidth memory means: not faster memory chips, but memory placed as close as physically possible and joined by a very wide bus. Wide needs short. The thousands of connections that give it its bandwidth only work over millimetres, which is why the memory cannot simply be moved further away and made bigger.
> CAPTION: The name describes a placement, not a technology. Close and wide, at the cost of being small and expensive.

### Fig 108 · 9:30
**The weights are read, never written**
- [HEAD] Nothing about the weights changes while the service runs
- [sub] the same 140 GB, for every request from every user
- [PROSE] The weights are read, used, and left exactly as they were. Two different users, two different questions, and the same numbers do the work. That is why one copy in memory can serve everybody, and it is the fact that makes batching possible in a later video. It also means the reading is pure overhead. The same bytes cross the same bus for every token and nothing is learned or saved by having read them before.
> CAPTION: Two consequences pointing opposite ways: one copy can serve everyone, and yet the same bytes must be re-read every single time.


## Two phases with opposite profiles
_Same model, same chip, same code, different economics._

### Fig 109 · 10:39
**Prefill and decode**
- [LABEL] Prefill
- [sub] the whole prompt at once
- [sub] t0
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] t6
- [sub] t7
- [sub2] every position through every layer, in parallel
- [LABEL] Decode
- [sub] one token at a time
- [sub] t8
- [sub2] a full forward pass for each one, then again, and again
- [PROSE] Prefill finishes with a representation for every position and is ready to generate. Decode then produces output tokens one at a time, each paying for its own complete trip through the model, until a stop signal or a length limit.
> CAPTION: They run on the same chip with the same weights and the same code. Everything that differs between them comes from how many tokens share each load of the weights.

### Fig 110 · 10:39
**Why one phase can be parallel and the other cannot**
- [HEAD] Prefill: the prompt already exists, so nothing has to wait
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] t6
- [sub] t7
- [sub] t8
- [sub2] all eight go through the model together
- [HEAD] Decode: token nine does not exist until token eight is chosen
- [sub] t9
- [sub2] one at a time, each waiting on the one before
- [PROSE] The difference is not the model and not the hardware. It is that the prompt's tokens are all known in advance and the answer's tokens are not. Work that has no dependencies can be spread across a chip. Work that forms a chain cannot, however many arithmetic units are sitting idle.
> CAPTION: The dependency condition from Part 1, meeting the two phases. This single distinction produces every difference between them.

### Fig 111 · 11:46
**Where the 2 comes from**
- [HEAD] One output value is a sum of weighted inputs
- [sub] y = w1 x1 + w2 x2 + w3 x3 + ...
- [HEAD] Each term costs two operations
- [sub] w1 x x1
- [sub2] one multiply
- [sub] add to y
- [sub2] one addition
- [PROSE] The processor does not do these separately. It has a single instruction, the multiply-accumulate, that multiplies two numbers and adds the result into a running total in one step. It is still counted as two floating-point operations, because two arithmetic results are produced. That convention is where the 2 comes from, and it is the only place it comes from.
> CAPTION: Not a fudge factor or a rule of thumb. Every weight in the model participates in exactly one multiply-accumulate per token, and that instruction counts as two operations.

### Fig 112 · 11:46
**Every weight is used exactly once**
- [HEAD] One layer's weight matrix, times one token's vector
- [sub2] rows =
- [sub2] outputs
- [sub2] columns = inputs
- [sub2] the token
- [sub2] the output
- [PROSE] Every cell of the matrix is a weight. Output row i is the sum over j of weight(i,j) times input j, so each weight is touched in exactly one term of exactly one output. Not once per layer. Not once per head. Once, full stop. 24 weights drawn, so 24 multiply-accumulates, so 48 operations. Whatever the shape, the operation count is twice the number of cells.
> CAPTION: This is the step that makes the rule exact rather than approximate. A weight cannot be reused within one token's pass, because there is only one input vector for it to act on.

### Fig 113 · 11:46
**Summing over the whole model**
- [LABEL] One layer, all of it matrix multiplies
- [sub] query
- [sub] key
- [sub] value
- [sub] combine
- [sub] feed-forward, first
- [sub] feed-forward, second
- [PROSE] Six matrices, and the rule holds for each of them separately. Add them up and you have every weight in the layer. Add up the layers and you have every parameter in the model.
- [sub] operations per token = 2 x parameter count
- [PROSE] So a parameter count, which is the one number every model is advertised with, converts straight into an operation count. Nothing else about the architecture needs to be known.
> CAPTION: The rule survives the sum because it holds matrix by matrix. That is why a single headline number is enough to price a forward pass.

### Fig 114 · 11:46
**Counting operations from the parameter count**
- [sub] operations per token = 2 x parameter count
- [PROSE] Every parameter is used exactly once per forward pass, in one multiply and one add. Two operations per parameter. 70 billion parameters
- [sub] x 2
- [sub2] = 140 billion operations
- [PROSE] And the bytes moved are the same count times the bytes per parameter, which for 16-bit weights is 140 gigabytes. So for a single token, the operations and the bytes are numerically almost the same. Hold that thought; it is about to matter enormously.
> CAPTION: A derivation worth being able to do from memory. It turns any parameter count straight into both an operation count and a byte count.

### Fig 115 · 11:46
**What the rule does not count**
- [HEAD] Attention itself has no weights in it
- [sub] Q Kt and softmax x V
- [sub2] activation times activation,
- [sub2] so no parameter is involved
- [PROSE] Those multiplies are real work and the rule does not count them, because there is no weight to attach them to. Their cost grows with context length instead of with model size. context 2,048
- [sub2] 5.4 GFLOP, +4%
- [PROSE] context 8,192
- [sub2] 21.5 GFLOP, +15%
- [PROSE] context 128,000
- [sub2] 335.5 GFLOP, +240%
- [PROSE] At a short context it is a rounding error. At 128,000 tokens it is more than twice the work the weights do, and the rule has stopped being a useful estimate. Two smaller corrections in the other direction: the embedding table is about 1.5% of the parameters and only one row of it is read, and softmax and normalisation add a little back.
> CAPTION: Worth knowing the boundary. The rule prices the weights, and the weights are the whole story only while the context is short.

### Fig 116 · 11:46
**Why operations and bytes come out equal**
- [HEAD] The same parameter count drives both sides
- [PROSE] Operations
- [sub] 2 x N = 140 billion
- [PROSE] Bytes, at 16 bits
- [sub] N x 2 = 140 gigabytes
- [sub] 1 operation per byte
- [PROSE] The 2 in the operation count and the 2 bytes of a 16-bit weight are unrelated quantities that happen to be the same number. Their ratio is exactly 1, and that is the arithmetic intensity of a single-token decode step. The chip needs about 295 to keep its arithmetic units busy.
- [HEAD] And the coincidence is specific to 16 bits
- [PROSE] FP32
- [sub2] 0.5 per byte
- [sub2] ridge at batch 590
- [PROSE] FP16
- [sub2] 1 per byte
- [sub2] ridge at batch 295
- [PROSE] INT8
- [sub2] 2 per byte
- [sub2] ridge at batch 148
- [PROSE] INT4
- [sub2] 4 per byte
- [sub2] ridge at batch 74
- [PROSE] Narrower weights do not change the operation count at all. They only shrink the bytes, which is why quantization moves this number and why batching moves it further.
> CAPTION: This is the payoff of the whole derivation. One rule for operations, one for bytes, and their ratio is the number that decides whether a chip is waiting on maths or on memory.

### Fig 117 · 12:09
**The same toll, a different payoff**
- [HEAD] Prefill: one weight load, thousands of tokens
- [sub] load once
- [sub2] every byte pulled is used in roughly 2,000 multiply-accumulates
- [HEAD] Decode: one weight load, one token
- [sub] load once
- [sub2] one
- [PROSE] The memory bus pays exactly the same toll in both phases. The payoff from that toll differs by a factor of thousands. A natural first guess is that decode is slow because the model is large. That is true and it misses the point: the model is the same size in both phases and moves the same bytes. What changes is how much useful computation those bytes perform.
> CAPTION: This is the structural fact that defines LLM inference. Prefill amortises the cost of moving the model across thousands of tokens; decode has nobody to share it with.

### Fig 118 · 12:09
**What amortising means**
- [HEAD] Amortise: spread a fixed cost over more work
- [sub] cost per token = 140 GB / how many tokens share the read
- [PROSE] 1 token
- [sub2] 140 GB
- [PROSE] 10 tokens
- [sub2] 14 GB
- [PROSE] 200 tokens
- [sub2] 0.7 GB
- [PROSE] 2,000 tokens
- [sub2] 0.07 GB
- [PROSE] The read costs the same every time. What changes is how many tokens are produced from it, and the per-token cost falls in exact proportion. Prefill sits at the bottom of this list. Decode sits at the top, and cannot move down on its own, because there is only ever one token to show for the read.
> CAPTION: The word appears constantly from here on. It is division, and the last line is why decode is stuck at the worst row.


## Arithmetic intensity and the roofline
_The vocabulary that makes the gap precise._

### Fig 119 · 14:04
**What bound by means**
- [HEAD] A bottleneck is whichever step is slowest
- [sub] fast step
- [sub] slow step
- [sub] fast step
- [PROSE] Speeding up either fast step changes nothing at all. Only the slow one sets the pace, and improving it is the only change that helps. Everything on this chip has two possible bottlenecks: the arithmetic, or the memory. A workload is described as bound by whichever it runs out of first. Memory bound means the arithmetic units are idle waiting for data. Compute bound means the memory has capacity to spare. Both are wasteful; they waste different things.
> CAPTION: Two words used constantly and rarely defined. Nothing is ever bound by both at once, which is what makes the roofline a picture with two regions.

### Fig 120 · 14:04
**Arithmetic intensity**
- [sub] arithmetic intensity = operations performed / bytes moved
- [PROSE] How much work the chip gets out of each byte it drags in from off-chip memory. High intensity
- [sub] reuses each byte many times
- [PROSE] Low intensity
- [sub2] loads a byte, does almost nothing, needs another
- [PROSE] The point of the metric is that it tells you in advance which resource a workload will exhaust, before you run anything.
> CAPTION: One ratio, computed from the shapes of the problem alone. It is the single most useful number in this series.

### Fig 121 · 14:51
**What a logarithmic axis means**
- [HEAD] On an ordinary scale, small things vanish
- [sub2] 1, 3, 30 and 300 on a linear axis: the first three are invisible
- [HEAD] On a logarithmic scale, each equal step is a multiplication
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [sub2] 10,000
- [PROSE] Same distance along the axis, but now it means ten times rather than plus ten. Both axes of the roofline diagram later are drawn this way. It is the only way to put a quantity of 1 and a quantity of 300 on the same picture and still see both of them.
> CAPTION: Needed to read the next figure honestly. A straight line on log axes is a multiplication, not an addition.

### Fig 122 · 14:51
**How to read the diagram that follows**
- [HEAD] Reading a plot with two axes
- [sub2] y
- [sub2] x
- [sub2] one point: one x, one y
- [PROSE] A point is a pair. Read across to the vertical axis for one number, down to the horizontal axis for the other. On the diagram that follows, the horizontal axis is how much arithmetic a workload does per byte, and the vertical axis is how fast it therefore runs. Each workload is one point. Where it sits left to right is a property of the workload; how high it can rise is a property of the chip.
> CAPTION: Two sentences of orientation that make the next three figures readable, rather than a shape to be taken on trust.

### Fig 123 · 14:51
**The roofline**
- [sub2] the ridge
- [sub2] flat ceiling: peak arithmetic
- [sub2] slanted ceiling: bandwidth
- [sub2] memory bound
- [sub2] compute bound
- [sub] attainable = min( peak, bandwidth x intensity )
- [PROSE] Both axes are logarithmic. The slanted ceiling rises at a rate that is exactly the memory bandwidth: at one operation per byte with 3 TB/s you can reach 3 trillion operations a second; at ten operations per byte, thirty trillion. A workload hits whichever ceiling is lower.
> CAPTION: Introduced by Williams, Waterman and Patterson in 2009. Two ceilings and one rule for choosing between them.

### Fig 124 · 14:51
**Why the roofline bends**
- [HEAD] Why the picture has a corner
- [sub2] here, more arithmetic per byte
- [sub2] means more speed
- [sub2] here it does not: the arithmetic
- [sub2] units are already full
- [sub2] the corner
- [PROSE] On the left the memory is the bottleneck, so anything that gets more work out of each byte raises the line. On the right the arithmetic is the bottleneck, and it cannot go faster. The corner is where the two limits are equal. Left of it, improve the bytes; right of it, improving the bytes buys nothing. That is the entire diagram. The next figure gives the corner a number.
> CAPTION: The shape is not a convention to memorise. It is what happens when two independent limits are drawn on the same axes and the lower one always wins.

### Fig 125 · 14:04
**Why the ratio is the interesting number**
- [HEAD] What a ratio tells you that two numbers do not
- [PROSE] Chip A
- [sub] 500 ops/s
- [sub] 50 B/s
- [sub2] ratio 10
- [PROSE] Chip B
- [sub] 1,000 ops/s
- [sub] 100 B/s
- [sub2] ratio 10
- [PROSE] Chip B is twice the chip in both directions, and the ratio is identical. A workload sits on the same side of the corner on both. So the ratio says what kind of work a chip suits, and the absolute numbers say how fast it gets through it. Two different questions. The memory wall is a statement about the ratio: the top number has been growing faster than the bottom one for a decade.
> CAPTION: A ratio is scale-free, which is exactly why it is the right way to describe a trend that has held across many generations of hardware.

### Fig 126 · 16:44
**Deriving the ridge**
- [HEAD] The ridge is where the two ceilings meet
- [sub] bandwidth x intensity = peak
- [sub] intensity = peak / bandwidth
- [PROSE] Solve for the intensity at which the slanted line reaches the flat one. That crossing point is the ridge, and it is a property of the chip alone, not of any workload.
- [HEAD] For an H100
- [PROSE] peak
- [sub] 989 trillion ops/s
- [PROSE] bandwidth
- [sub] 3.35 trillion bytes/s
- [sub] = 295 ops per byte
- [PROSE] Below 295 operations per byte, a workload is memory bound on this chip. Above it, compute bound. One division, and the chip is characterised.
> CAPTION: Worth doing yourself once for whatever hardware you use. It is the number every workload gets compared against.

### Fig 127 · 16:21
**What the roofline ignores**
- [LABEL] One memory level
- [sub] no cache hierarchy
- [LABEL] No launch latency
- [sub] work starts instantly
- [LABEL] Perfect pipelining
- [sub] no bubbles
- [PROSE] A simplification on every count. As a first-order diagnostic for whether a workload will starve the maths units or starve the memory bus, it has held up since 2009.
> CAPTION: Knowing the model's assumptions is what lets you trust it where it applies and distrust it where it does not.


## Placing the two phases
_The same diagram, and a factor of two thousand between them._

### Fig 128 · 17:30
**The two numbers**
- [HEAD] Prefill, 70B model, 2,000-token prompt
- [PROSE] operations
- [sub] about 290 trillion
- [PROSE] bytes moved
- [sub] about 146 GB
- [sub2] weights, plus activations and cache writes
- [sub] = about 2,000 ops per byte
- [HEAD] Decode, one token, batch size one
- [PROSE] operations
- [sub2] about 140 billion
- [PROSE] bytes moved
- [sub] 140 GB
- [sub2] the same weights, every time
- [sub] = about 1 op per byte
- [PROSE] Same model, same chip. Two thousand against one.
> CAPTION: Both computed from the shapes alone. Decode moves the identical bytes and gets one operation out of each of them.

### Fig 129 · 18:18
**Both phases on one diagram**
- [sub2] ridge, 295
- [sub2] decode, intensity 1
- [sub2] prefill, intensity 2,000
- [PROSE] Prefill sits about seven times to the right of the ridge, up on the flat ceiling: the arithmetic units are saturated and the memory bus has bandwidth to spare. Decode sits nearly three hundred times to the left, deep on the slanted ceiling, with HBM at close to 100% utilisation and the arithmetic units running at under 1%. That is the structural answer to where the thirty milliseconds went. Nothing is broken. The workload's shape forces the chip into a regime where it can only wait.
> CAPTION: Two points on the same picture, separated by a factor of two thousand. Everything the rest of this series does is an attempt to move the left-hand point rightward.

### Fig 130 · 19:26
**The hard throughput ceiling**
- [sub] maximum tokens per second = bandwidth / bytes per token
- [PROSE] 3.35 TB/s
- [sub] divided by
- [sub2] 140 GB per token
- [sub] = about 24 tokens per second
- [PROSE] A physical ceiling, not a software one. No kernel optimisation can exceed it, because the limit is simply how fast the bus can deliver weights.
- [HEAD] The only three ways past it
- [LABEL] Raise bandwidth
- [sub] a different chip
- [LABEL] Shrink bytes per token
- [sub] lower precision, compression
- [LABEL] Amortise the transfer
- [sub] batching, or several at once
- [PROSE] Each of those three becomes a later video in the series.
> CAPTION: Derivable in one line, and it bounds every serving system ever built on this hardware. The three escape routes are the entire roadmap.


## The KV cache
_Why decode is sequential, and the structure that makes it survivable._

### Fig 131 · 21:23
**Why the work grows as the answer gets longer**
- [HEAD] Every new token re-reads the whole conversation
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub2] reads 4
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub2] reads 5
- [sub] t1
- [sub] t2
- [sub] t3
- [sub] t4
- [sub] t5
- [sub] t6
- [sub2] reads 6
- [PROSE] The gold token is the new one. To produce it the model must attend over every token before it, so the amount read grows with every step. The model has no memory between steps. Whatever it needs about the earlier tokens must either be recomputed or kept somewhere. Recomputing means redoing the same work again and again. Keeping it means storing something that grows. The next figures are about which of those is cheaper.
> CAPTION: The picture behind the quadratic cost. Each row is one decode step, and each is longer than the last.

### Fig 132 · 21:23
**Why decode cannot be parallelised**
- [HEAD] Attention is causal: a token sees only what came before it
- [sub2] token 1
- [sub2] token 5
- [sub2] keys it may attend to
- [PROSE] A token at position t can attend to positions 0 through t, never forward. In prefill every token exists at once, so all of this can be computed in parallel. In decode the token at position t does not exist until the one before it has been generated. That is the sequential dependency, and it comes from the mask, not from the hardware.
> CAPTION: The triangle is the whole reason the two phases behave differently. Prefill fills it in one shot; decode adds one row at a time.

### Fig 133 · 22:31
**The redundant work, quantified**
- [HEAD] The observation that saves everything
- [LABEL] The keys and values for earlier positions do not depend on the new token
- [PROSE] They were fully determined when those earlier tokens were processed, and they never change afterwards. So recomputing them for every new token would be doing identical work repeatedly.
- [HEAD] How bad that would get
- [sub] generating token 1,000
- [sub] recompute 999 positions
- [sub] total over n tokens
- [sub] n(n-1)/2, quadratic in n
- [PROSE] For a thousand tokens that is about half a million position-recomputations instead of a thousand. The waste grows with the square of the conversation length.
> CAPTION: Quadratic against linear. Without a fix, long conversations would become impossible rather than merely expensive.

### Fig 134 · 22:31
**Linear against quadratic**
- [HEAD] Two ways to grow
- [PROSE] Linear
- [sub2] work per token stays flat
- [PROSE] Quadratic
- [sub2] work per token keeps rising
- [PROSE] At ten tokens the two are barely different. At ten thousand the second is a thousand times worse, because each token costs more than the last. Recomputing everything at every step is the second shape. That is why nobody does it, and why the thing described next exists.
> CAPTION: Two shapes worth being able to recognise. Almost every scaling problem in this series is one term of the second kind growing past everything of the first.

### Fig 135 · 23:17
**What a cache is, in general**
- [HEAD] A cache is something kept so it need not be made again
- [sub] work it out every time
- [sub] work it out once, keep it
- [PROSE] The trade is always the same: memory in exchange for time. You spend space to avoid repeating an effort. It pays off only when the kept thing is used again. Something computed once and never needed again is worth nothing to keep. In decode, every earlier token is needed at every later step, which is about as favourable as a cache can get. The cost is that the kept thing grows with every token. That growing store is the key-value cache, and it becomes the central problem of most of the videos that follow.
> CAPTION: Stated generally first, because the specific one is easier to judge once you know what the trade always is.

### Fig 136 · 23:17
**The key-value cache**
- [LABEL] Each decode step
- [sub] compute one K and V
- [sub] append to cache
- [sub] read the whole cache
- [PROSE] Every key and value a token produces is written into a dedicated region of HBM. The next token computes only its own, appends it, and reads the accumulated cache to compute attention. Linear work per token instead of quadratic. It is an obvious optimisation once seen, every serving system implements it, and it is the reason decode is tractable at all. It is also the reason every other optimisation in this series exists.
> CAPTION: A caching trick that solves one problem and creates the one that dominates everything downstream.

### Fig 137 · 23:17
**What actually re-enters the model each step**
- [HEAD] What you might picture: the whole text fed in again
- [sub2] ...
- [sub2] all 1,032 tokens, through the model, every step
- [HEAD] What actually happens: one token, plus the cache
- [sub2] the dashed ones are already in the cache and are not recomputed
- [PROSE] Only the newest token goes through the model. Everything before it is represented by keys and values computed once and kept, which is exactly what the cache is for. Re-running the whole context every step would be a thousand times the work at this length, and worse as the conversation grows. So the growing text is not fed back in. It is already there, in a form the model can attend to without recomputing it.
> CAPTION: The correction most people need. The sequence grows, but the work per step does not grow with it in the way the picture suggests.

### Fig 138 · 24:03
**Where the L in the cache formula comes from**
- [sub] cache = 2 x layers x KV heads x head dimension x bytes
- [PROSE] You have seen this formula already. The question you just asked is exactly what the second term is doing there.
- [HEAD] If Q, K and V were computed once
- [sub] no L at all
- [HEAD] Because every layer computes its own
- [sub] x 80
- [PROSE] Each layer produces a different key and a different value for the same token, from a different input and with different weights. All eighty have to be kept, because layer 40 attending to an earlier token needs layer 40's key for it, not layer 1's. So the cache holds eighty keys and eighty values per token, and the L in that formula is the direct consequence of what you asked about.
> CAPTION: The payoff. If the projection happened once, the cache would be eighty times smaller and most of this series would not exist.

### Fig 139 · 24:03
**Eighty keys and eighty values, per token**
- [HEAD] One token, eighty layers deep
- [sub] L1
- [sub] L2
- [sub] L3
- [sub] L4
- [sub] L5
- [sub] L6
- [sub] L7
- [sub] L8
- [sub] L9
- [sub] L10
- [sub2] …
- [sub2] a key and a value at every one of the eighty
- [PROSE] per layer, per token
- [sub] 4 KB
- [PROSE] x 80 layers
- [sub] 320 KB for one token
- [PROSE] That is the number the rest of this video uses. It is large because of the eighty, and the eighty is there because each layer works on a different representation of the same token. Cutting KV heads from 64 to 8 cuts it eightfold, which is what grouped-query attention does. Nothing cuts the number of layers, because that is the model. So every technique that shrinks this cache attacks one of the other terms in that formula.
> CAPTION: The 320 kilobytes decomposed. Knowing which term each later technique attacks makes the rest of the series much easier to follow.

### Fig 140 · 24:03
**How big the cache gets**
- [sub] cache per token = 2 x layers x KV heads x head dimension x bytes
- [PROSE] The 2 is one key and one value. For Llama 3 70B: 80 layers, 8 key-value heads of dimension 128, at 16-bit precision.
- [sub] 2 x 80 x 8 x 128 x 2 = 327,680 bytes
- [PROSE] About 320 kilobytes for every token held in context, and it scales linearly with conversation length. 1,000 tokens
- [sub2] 0.33 GB
- [PROSE] 10,000 tokens
- [sub2] 3.3 GB
- [PROSE] 100,000 tokens
- [sub2] 33 GB
- [PROSE] At a hundred thousand tokens the cache is already about a quarter of the model's own footprint.
> CAPTION: A formula worth memorising. It converts any model shape and any context length straight into gigabytes.

### Fig 141 · 25:13
**The cache and the weights compete**
- [LABEL] HBM, one bandwidth budget
- [sub] the weights, read every step
- [sub] the cache, read every step
- [sub2] both draw on the same bus
- [PROSE] Every decode step reads every weight and also reads every cache entry up to the current position. The bigger the cache grows, the more bytes per token, and the lower the throughput ceiling derived earlier. The model and the conversational state of the request compete for the same resource. That competition shapes every technique in the rest of the series: shrinking the cache, sharing it across requests with a common prefix, splitting it across machines, or refusing to materialise parts of it at all.
> CAPTION: Two different things reading from one budget. Once the cache is large, optimising the weights alone stops being enough.


## What the user feels
_Four numbers, and the one that actually decides._

### Fig 142 · 26:41
**Latency and throughput**
- [HEAD] Latency and throughput, away from computers
- [LABEL] Latency
- [sub] how long one letter takes
- [sub] to arrive
- [LABEL] Throughput
- [sub] how many letters the service
- [sub] delivers in a day
- [PROSE] A van that leaves once a week, crammed full, has enormous throughput and terrible latency. A motorcycle courier carrying one letter has the reverse. Neither is better. They answer different questions, and improving one often costs the other. A serving system faces exactly this choice: wait to gather more requests and get more done, or answer immediately and get less done. That tension is why the last measurement in this video counts only the tokens that arrived in time.
> CAPTION: An example with no computers in it, because the trade-off is not a computing idea and is much easier to see in a delivery van.

### Fig 143 · 26:41
**The two latencies a user experiences**
- [sub] a pause
- [HEAD] time to first token
- [sub2] TTFT
- [HEAD] time per output token
- [sub2] TPOT, or inter-token latency
- [PROSE] TTFT is governed by prefill, because the whole prompt must pass through every layer before any output can appear. Half a second for a short prompt, several seconds for a long one. TPOT is governed by decode, because each output token needs its own complete forward pass. TTFT decides whether a product feels responsive. TPOT decides whether the text arrives fast enough to read comfortably or stutters in a way that breaks concentration.
> CAPTION: Both are visible to the person waiting, and they are produced by phases with opposite resource profiles.

### Fig 144 · 27:26
**Two metrics, two different levers**
- [LABEL] Improving TTFT
- [sub] is a compute problem:
- [sub] keep the arithmetic units fed
- [LABEL] Improving TPOT
- [sub] is a bandwidth problem:
- [sub] move fewer bytes per token
- [PROSE] Different bottlenecks, different engineering. A change that helps one may do nothing at all for the other, and occasionally makes it worse.
> CAPTION: This is why serving systems eventually separate the two phases onto different hardware entirely.

### Fig 145 · 28:11
**Throughput against goodput**
- [PROSE] Throughput
- [sub] all tokens generated per second
- [PROSE] Goodput
- [sub] only the ones in time
- [PROSE] Goodput is not a separate measurement so much as a filter on throughput: count only the tokens delivered inside the system's promised latency targets. You can run enormous throughput by packing thousands of requests into huge batches and processing them slowly. The tokens get generated and the counter looks impressive. But if every user stares at a blank screen for forty seconds before their first character, every one of those tokens missed its TTFT target and goodput is zero. The system is producing tokens nobody was willing to wait for. Goodput, not raw throughput, is what a production system is optimising for.
> CAPTION: The most important distinction in the video for anyone who operates a system rather than benchmarks one.


## Where that leaves us
_One number, resolved._

### Fig 146 · 29:42
**The recap**
- [sub] the factor of 300 = bandwidth / bytes per token
- [PROSE] The gap between what the arithmetic implies and what the chip delivers is not a mystery. It is a division between two hardware numbers and one property of the workload.
- [HEAD] The chain, in five links
- [sub] compute outgrows bandwidth
- [sub] a forward pass streams every weight
- [sub] prefill amortises, decode does not
- [sub] the KV cache adds to the bill
- [sub] goodput is what is actually sold
- [PROSE] Every link is a division or a multiplication you can now do yourself.
> CAPTION: Five sentences that between them explain the thirty milliseconds. Nothing in the chain requires anything beyond arithmetic.

### Fig 147 · 30:27
**The road ahead**
- [LABEL] Where the series goes from here
- [sub] the accelerator
- [sub] the code on it
- [sub] fewer bits
- [sub] across many chips
- [sub] part of itself
- [sub] serving at scale
- [sub] idle units in decode
- [sub] one real request
- [PROSE] Open up the hardware, look at the kernels, store the weights in fewer bits, split the model across chips, build models that only use part of themselves per token, serve at production scale, exploit the idle arithmetic units during decode, and finally trace one real request end to end through the whole stack. Every one of them is an attack on the same division.
> CAPTION: Each later video takes one term in the ratio and tries to move it. Holding that frame makes the whole series read as a single argument.


<!-- 147 figures -->
