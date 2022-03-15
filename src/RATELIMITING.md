# Rate Limiting
This folder is dedicated to handling the Riot rate limit in a way that is compatible with CF workers.

## Riot Rate Limiting Overview
First of all a quick overview what Riot expects us to handle:
- App Rate Limit (Region/Platform Rate Limit)
- Method Rate Limit (Per-endpoint rate limit)

Both of these rate limits have multiple "buckets" attached to them, so an hourly & 10-second limit for example
It *is* a goal to respect any limit that may come up via the

## Exposed Data
To achieve this Riot gives us some data to work with.
Specifically there are headers for each of the above types of rate limits, with the current call count, the maximum call count and the time until reset.


# Burst vs Spread
Burst:
- Immediate access to any number of calls allowed on reset
- Given enough demand this effectively guarantees full use of the rate limit

Spread:
- Spread out access to the rate limit across the time
- Possibility for a few calls to fall off the edges between buckets

We generally aim for spreading the rate limit.

# Implementation
First thing that should be done when accessing Riot is checking the CF Cache for the request - if we are lucky we don't need to ask Riot at all.

If we decide a call to Riot is necessary, we need to aquire the rate limit.
To do this, each Rate Limit needs to maintain a list of possible "slots" timestamps when a request can be made, preferably sorted.
When we want to make a request we first need to find the next slot in our App Rate Limit and then find the next slot (from our app slot) in the method rate limit.

## Example
App slots: [t+10, t+15, t+20, t+25, t+30]
Method Slots: [t+8, t+16, t+24, t+32]

Find app slot()
assigned app slot: t+10
Remaining App Slots: [t+15, t+20, t+25, t+30]

Find method slot after t+10
-> t+16

Final State:
App Slots: [t+15, t+20, t+25, t+30]
Method Slots: [t+8, t+24, t+32]

-> The request can be done at t+16 (=max(t+10, t+16))

As you can see the method request at t+8 is going to go "unused" but this is expected - the app limit doesn't allow us to make use of all method limits at once.
