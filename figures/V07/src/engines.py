"""V7 Part 7: o015 rebuilt with the names the video gives (review §5 item 11) and a gloss of
Kubernetes, drawn as what it is: one orchestration layer over a fleet of engines.

  python3 figures/V07/src/engines.py
"""
from bcommon import SRT, arr, box, cell, emit, hd, prose, stamp, txt

DUTIES = [("place prefill and decode pools", 62, 200), ("route by prefix", 276, 150),
          ("move KV caches", 440, 178)]
PARTS = ["scheduler", "KV cache", "kernels"]


def o015():
    b = [f'<g class="u"><rect x="40" y="40" width="600" height="112" rx="14"/>'
         f'<text class="lbl" x="62" y="66">Orchestration layer</text>'
         f'<text class="sub" x="62" y="84">NVIDIA Dynamo, llm-d: one fleet of machines</text></g>']
    for lab, x, w in DUTIES:
        b.append(cell(x, 100, w, 30, "s", label=lab))
    for k, x in enumerate([40, 250, 460]):
        b.append(arr(x + 90, 156, x + 90, 186))
        b.append(f'<g class="u"><rect x="{x}" y="190" width="180" height="140" rx="12"/>'
                 f'<text class="lbl" x="{x + 18}" y="214">engine, node {k + 1}</text></g>')
        for j, part in enumerate(PARTS):
            b.append(cell(x + 14, 228 + j * 30, 152, 24, "m", label=part))
    body, yb = prose(372, [
        "An inference engine runs the model on one GPU or one node and owns the scheduler, the KV "
        "cache and the kernels, so batching, paging and prefix caching all happen inside one. vLLM, "
        "now a project of the PyTorch Foundation (the body that looks after PyTorch, a widely used "
        "open-source library for building neural networks), runs on NVIDIA and AMD GPUs, on Google's "
        "and Amazon's own AI chips (TPUs and Inferentia), on Intel and on Apple Silicon. SGLang is the "
        "engine behind the 96-GPU DeepSeek reproduction. "
        "TensorRT-LLM is NVIDIA's own, tuned hardest for NVIDIA hardware. Hugging Face's Text "
        "Generation Inference (TGI) is the serving toolkit built around models from the Hugging Face "
        "Hub, a public library of model files.",
        "An orchestration layer sits above the engines and coordinates a fleet of them. NVIDIA "
        "Dynamo and llm-d place the prefill and decode pools across nodes, route each request to the "
        "replica that already holds its prefix, and move KV caches between machines: work no single "
        "engine can see. llm-d is Kubernetes-native: it is built to run on Kubernetes, the standard "
        "open-source system for running programs across a fleet of machines, and uses its machinery "
        "rather than its own.",
        "Neither replaces an engine. Both run engines underneath, and that is the distinction that "
        "matters.",
    ])
    emit("o015", stamp(SRT, "All of this lives in software, and that"),
         "An engine runs one machine; an orchestrator runs a fleet of engines", yb + 32, b + [body],
         "Reading a benchmark correctly depends on knowing which layer it measures. An engine number "
         "and a fleet number are not comparable.",
         links=["the 96-GPU DeepSeek reproduction (P35 or o011, Part 5): point 'SGLang is the engine "
                "behind' at it once Part 5 is built"])


if __name__ == "__main__":
    o015()
