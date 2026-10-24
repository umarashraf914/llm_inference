"""V6 Part 5, what sparsity did not touch: P14 of plans/depth_pass/V06_review.md.

Source: DeepSeek-V3's config.json (kv_lora_rank 512, qk_rope_head_dim 64, 61 layers, 128 heads of 128)
and §2.1.1 of its report: only the compressed latent and the decoupled key are cached. Storage at 16 bits a
number is this figure's assumption, stated in its prose.

  python3 figures/V06/src/cache.py      writes figures/V06/items/p14.html
"""
from common import (DS, at, cell, dashed, dsv3, emit, f, hd, n, nb, prose, rect, txt)

TOKENS = 128_000
BYTES = 2                                                  # 16-bit storage


def p14():
    per_layer = DS["kv_rank"] + DS["rope_dim"]             # what MLA caches for one token, one layer
    mha_layer = DS["heads"] * (DS["nope_dim"] + DS["v_dim"])   # a key and a value of 128 for each of 128 heads
    tok = DS["layers"] * per_layer * BYTES
    mha_tok = DS["layers"] * mha_layer * BYTES
    req, mha_req = TOKENS * tok, TOKENS * mha_tok
    weights = dsv3()["total"]                              # bytes at FP8, one a weight
    assert per_layer == 576 and tok == 70_272 and round(req / 1e9, 1) == 9.0
    assert round(mha_layer / per_layer) == 57 and round(mha_tok / 1e6, 1) == 4.0 and round(mha_req / 1e9) == 512
    b = [hd(40, 46, "Cache per token = layers × numbers kept per layer × bytes per number")]
    b.append(cell(40, 66, 110, 40, "u", rx=6, label=f"{DS['layers']} layers"))
    b.append(txt(164, 91, "×", "sub2", "middle"))
    b.append(cell(178, 66, 196, 40, "u", rx=6, label=f"{per_layer} numbers: {DS['kv_rank']} + {DS['rope_dim']}"))
    b.append(txt(388, 91, "×", "sub2", "middle"))
    b.append(cell(402, 66, 90, 40, "u", rx=6, label=f"{BYTES} bytes"))
    b.append(txt(506, 91, "=", "sub2", "middle"))
    b.append(cell(520, 66, 120, 40, "h", rx=6, label=f"{n(tok)} bytes"))
    b.append(txt(40, 130, "no term in it counts experts: 8 of them or 256, the cache per token is the same", "sub2"))
    b.append(hd(40, 176, f"One request {n(TOKENS)} tokens long, in gigabytes, to scale"))
    X0, W = 250, 350
    SC = W / weights
    rows = [("the weights, every expert", weights, "u", False),
            ("its cache, if attention were plain", mha_req, "h", True),
            ("its cache with latent attention", req, "h", False)]
    for k, (lab, v, cl, hyp) in enumerate(rows):
        y = 196 + k * 42
        b.append(txt(40, y + 19, lab, "cap"))
        w = v * SC
        if hyp:
            b.append(dashed(X0, y, w, 28))
        else:
            b.append(rect(X0, y, max(w, 2), 28, cl))
        b.append(txt(X0 + max(w, 2) + 10, y + 19, f"{v / 1e9:,.0f} GB" if v > 20e9 else f"{v / 1e9:.1f} GB", "sub2"))
    body, yy = prose(196 + 3 * 42 + 48, [
        "The KV cache keeps, for every earlier token, what attention needs in order to look back at it "
        "({{fig:v01-o136}}). Its size is a product of attention's own shapes. DeepSeek V3's latent "
        f"attention keeps {per_layer} numbers per token per layer, a {DS['kv_rank']}-number latent plus a "
        f"{DS['rope_dim']}-number position part ({{{{fig:v03-o091}}}}): at 16 bits each, "
        f"{nb(f'{n(tok)} bytes')} per token.",
        f"Nothing in that product counts experts. A request {n(TOKENS)} tokens long holds "
        f"{req / 1e9:.1f} GB of cache whether the layers hold 8 experts or 256, and every new token reads "
        "all of it.",
        f"Plain multi-head attention with the same 128 heads would keep a key and a value of 128 numbers "
        f"for each head, {n(mha_layer)} numbers per layer, {round(mha_layer / per_layer)} times more: "
        f"{mha_tok / 1e6:.1f} MB a token, {mha_req / 1e9:.0f} GB for this one request. That is the cost "
        "latent attention attacks, and the one mixture of experts leaves exactly where it was.",
    ])
    emit("p14", at("the KV cache, the stored keys and values"), "A request's cache is set by attention alone",
         yy + 32, b + [body],
         "Bars drawn to scale. Sparsity shrank the work per token and not one byte of the cache: a "
         "long-context problem needs an attention fix, which is why DeepSeek built one.")


if __name__ == "__main__":
    p14()
