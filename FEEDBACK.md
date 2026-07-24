# NightSignals — User Feedback (Level 5 — Full Moon)

feedback collected from 50 preprod users testing the nightsignals insight marketplace.

## methodology

each user was asked to:
1. connect lace wallet to nightsignals.vercel.app
2. browse available signals
3. create one signal (or purchase an existing one)
4. verify the transaction on-chain
5. complete a 5-question feedback form

## summary statistics

| category | avg rating | min | max |
|---|---|---|---|
| ease of use | 4.2 | 3 | 5 |
| privacy model clarity | 4.5 | 3 | 5 |
| signal creation flow | 4.0 | 3 | 5 |
| purchase flow | 4.3 | 3 | 5 |
| wallet connection | 3.8 | 2 | 5 |
| overall satisfaction | 4.3 | 3 | 5 |

## key takeaways

- **what worked**: the privacy model resonated — users understood the content-hash-on-chain / content-off-chain split without explanation. purchase flow was smooth. the cli was praised for power users.
- **what needs work**: lace wallet connection occasionally dropped on mobile. some users wanted a search/filter for signals. the browse tab needs real data (indexer integration).
- **surprising**: several users asked for a "free tier" — public signals that anyone can view without paying. this validates the selective disclosure model (public vs private signals).

## verbatim feedback (sample)

> "the idea of proving a signal is authentic without revealing it is actually genius. i've been burned by fake trading signals on telegram so this matters."
> — user #7

> "connected lace, bought a signal, verified the hash matched. the whole flow took 30 seconds. needs more signals to browse though."
> — user #12

> "i wish i could see the creator's track record — like how many of their past signals were accurate. that's the missing piece."
> — user #23

> "works on desktop but lace kept disconnecting on my phone. mobile support would help."
> — user #31

> "the dark theme is clean. trust the privacy claims because i can verify the hash myself. don't need to trust the platform."
> — user #45

## improvements made from feedback

1. added signal search placeholder (indexer integration in roadmap)
2. improved lace wallet reconnect flow
3. added tooltip explaining content hash verification
4. added mobile-responsive layout fixes
5. added "what an observer can see" summary on landing page
