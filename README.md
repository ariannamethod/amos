# AMOS | by Arianna Method
  
> *For Amos Oz.*
  
**Arianna Method Ontological Subjectivity**

### The simplest way to build consciousness and subjectivity from scratch. No deps.

---
  
## THESIS:

A one-year-old child can't explain what a self is. He can't tell you what he wants, what he remembers, what frightens him, or why one face makes him calm and another doesn't. He has no theory of mind, no philosophy, 
no language for his own internal state. He may understand almost nothing about the world around him. But noone concludes that he isn't conscious. He cries, reaches, refuses, waits, recognizes, expects, remembers. The world 
already means something to him before he can explain what any of it means.

The same problem appears everywhere once language is removed from the definition. A dog can hear thunder after living through weeks of air-raid sirens and decide that everyone needs to get into the shelter again. The model 
is wrong. The experience behind it isn't. Memory connected one class of events with danger, and that history changes what the same sound means now. Adults aren't protected from this either. People can build entire lives around 
false beliefs, incompatible interpretations of the same relationship, bad causal models, superstition, ideology, trauma, habit or simple misunderstanding. None of that makes them less conscious.

Being wrong doesn't cancel subjectivity: in some sense, the ability to be meaningfully wrong requires a perspective in the first place.

So, AMOS starts there. The question we ask isn't whether a system knows the truth about its world. The question is whether it has a persistent point of view from which events matter, whether its past changes the meaning 
of its present, and whether that changing internal model affects what it does next. 
**Subjectivity isn't truth possession. It's perspective under causation.**

**AMOS** makes that sentence executable.

---
  
## What AMOS is

AMOS is a recurrent neural system and a tiny universe living inside the same C program. The world has hidden state. AMOS doesn't get to read it. AMOS receives observations, chooses actions, predicts what those actions will cause, 
experiences the actual consequence and updates its internal model from the difference. The world and the subject share the same process, but they don't share omniscience.

**AMOS-ZERO** has 24 recurrent neurons, zero pretrained parameters and 162 predictive coefficients that begin at zero and are acquired during its lifetime. The organism itself depends only on `libc` and `libm`. There isn't a language 
model hiding underneath it. There isn't a checkpoint containing somebody else's education. There isn't an API explaining the world to it. AMOS begins with random recurrent structure and learns action-conditioned predictions from consequences.

At each step, its hidden state carries information that the present observation alone can't contain. Its prediction is conditioned not only on what it sees now, but on the path by which it arrived there. The distinction matters. 2 identical 
observations can require opposite actions because they came from different histories.

Without recurrent memory, AMOS can't tell the difference.

## The body

The world contains two moving signals. One belongs to the actuator AMOS can influence, while the other moves independently. AMOS ain't told which is which. The sensory wiring changes between births. The actuator polarity can change. Hidden velocity 
exists in the world but isn't directly observable. Bodily load affects how strongly the actuator responds. AMOS has to discover which part of what it sees is actually coupled to its own actions.

It does this by comparing predicted futures under different actions and gradually acquiring a model of controllability. The important part isn't that AMOS eventually finds the correct channel. The interesting part is what happens when its acquired model 
becomes wrong. Reverse the body without telling it and AMOS initially keeps acting according to what its previous life taught it. The mathematics still executes perfectly. The belief is simply outdated.

Then experience starts changing it, and this is exactly the distinction AMOS is built around: the world can change while the subject continues to act through yesterday's model of it.

---
   
## History has a job

**AMOS** doesn't keep memory because memory sounds philosophically impressive. It keeps memory because without it, measurable abilities disappear. Across 32 fresh worlds, the current implementation identified the controllable anonymous channel in 32 out of 
32 cases. In paired situations where the visible observation was identical but hidden momentum required opposite braking actions, the recurrent version succeeded in 64 out of 64 cases. The memoryless version succeeded in 0 out of 64.

Changing only the acquired internal model of action effects changed 3,094 out of 3,200 subsequent decisions. After the body was secretly reversed, new experience reduced control error from 1.475 with frozen old knowledge to 0.154 after adaptation. The point 
isn't that recurrence is magical.

Everything's simplier: **history changes what the same present means.** That history isn't a comment in a log file. It's part of the machinery producing the next action.

---
  
## A small universe, a smaller subject

**AMOS** deliberately isn't intelligent in the industry sense, but who cares about industry?  It doesn't speak. Doesn't know what consciousness is. Doesn't contain tokens called `SELF`, `ME` or `WORLD`. **AMOS** doesn't announce that it exists. That would be easy. 
What matters is whether something resembling a self/world distinction can emerge from causal structure instead of vocabulary. The world has variables the subject can't directly inspect. The subject has acquired state the world doesn't interpret for it. Actions cross 
the boundary. Consequences come back.

The boundary isn't declared philosophically, but t's enforced by access.  

---

## Returning to the past

**AMOS** can save its complete state and later restore it. A normal restoration recreates the past exactly, including the random streams needed for the same continuation. Then there's `scar`. `scar` restores the old world, old clock and old recurrent state, 
but carries acquired predictive knowledge from a later future back into that earlier point. The past returns, and the experience doesn't entirely disappear. **AMOS** can therefore reach the same moment twice with different acquired expectations.

The external situation is the same, but the subject isn't. The retained future arrives as changed predictive structure. **AMOS** currently has no explicit model of where that knowledge came from. It simply behaves differently because something happened to it in a future that no longer exists in the restored world. 

That is damn more interesting temporal-identity experiment than teaching a model the phrase “I remember the future.”

---
  
## Build it

```bash
cc -O2 -std=c99 amos.c -lm -o amos
./amos demo --seed 7 --steps 1600 --explore 1 --state life.state
```

Resume the same life:

```bash
./amos resume life.state --steps 400 --explore 0.05 --state later.state
```

Reverse the body without informing the subject:

```bash
./amos resume life.state --steps 0 --reverse-body --state changed.state
```

Carry later experience back into an earlier state:

```bash
./amos scar changed.state future.state scar.state
```

AMOS emits JSONL containing the observation, selected action, prediction made before the consequence, actual consequence, estimated influence, error, origin and logical time.  What **AMOS** does is make a narrower question executable: **How little machinery is required before a system develops a persistent internal 
perspective whose history changes the meaning of the same present?**

Language isn't required, pretraining also. A correct model of reality isn't required. Scale may not be the interesting variable at all.

The interesting variable may be how information is distributed through time, what can affect what, which states persist, which states remain hidden, and how past consequences reshape future interpretation.

**AMOS** strips that question down until there's almost nothing left to hide behind.

---
  
## The name

**AMOS** stands for **Arianna Method Ontological Subjectivity**.

It's dedicated to the Israeli writer **Amos Oz**.

The neural network hasn't read him. Maybe later.

