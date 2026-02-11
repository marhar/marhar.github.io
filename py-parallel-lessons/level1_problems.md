# Level 1 Problems: Pattern Familiarization

These exercises are for learning and memorizing the code patterns. Each focuses on a single concept.

---

## concurrent.futures

### 1.1 Basic Submit
Write a function that takes a list of numbers and uses `ThreadPoolExecutor` with `submit()` to compute their squares in parallel. Return results as a list.

```python
def parallel_squares(numbers: list[int]) -> list[int]:
    # Use executor.submit() for each number
    # Collect results from futures
    pass
```

---

### 1.2 Using map()
Rewrite 1.1 using `executor.map()` instead of `submit()`.

```python
def parallel_squares_map(numbers: list[int]) -> list[int]:
    # Use executor.map()
    pass
```

---

### 1.3 as_completed
Process a list of numbers, printing each squared result as soon as it completes (not in input order).

```python
def squares_as_completed(numbers: list[int]) -> None:
    # Use as_completed() to print results as they finish
    pass
```

---

### 1.4 Timeout Handling
Submit a task that might be slow. Use `future.result(timeout=...)` to handle the case where it takes too long.

```python
import time
import random

def slow_task():
    time.sleep(random.uniform(0.5, 2.0))
    return "done"

def run_with_timeout(timeout_seconds: float) -> str | None:
    # Submit slow_task, return result or None if timeout
    pass
```

---

### 1.5 ProcessPoolExecutor
Compute factorial of numbers using `ProcessPoolExecutor` (simulating CPU-bound work).

```python
import math

def parallel_factorials(numbers: list[int]) -> list[int]:
    # Use ProcessPoolExecutor
    pass
```

---

## threading Primitives

### 1.6 Lock
Create a shared counter that multiple threads increment. Use a Lock to prevent race conditions.

```python
def increment_counter(n_threads: int, increments_per_thread: int) -> int:
    # Each thread increments a shared counter
    # Return final counter value (should equal n_threads * increments_per_thread)
    pass
```

---

### 1.7 Semaphore
Simulate an API with max 2 concurrent requests. Use a Semaphore to enforce this limit.

```python
def simulate_api_calls(n_calls: int, max_concurrent: int) -> list[str]:
    # Make n_calls, but only max_concurrent can run at once
    # Return list of results
    pass
```

---

### 1.8 Event
Start worker threads that run until a stop event is signaled.

```python
def run_workers_until_stopped(n_workers: int, run_seconds: float) -> int:
    # Start n_workers that increment a counter in a loop
    # After run_seconds, signal them to stop
    # Return total count
    pass
```

---

### 1.9 Queue (Producer-Consumer)
Implement a producer that puts numbers 1-10 on a queue, and a consumer that reads and prints them.

```python
def producer_consumer_demo():
    # Producer puts items, consumer prints them
    # Use None as sentinel to signal end
    pass
```

---

## asyncio

### 1.10 Basic gather
Fetch 3 URLs concurrently using `asyncio.gather()`. (Simulate with `asyncio.sleep()`.)

```python
async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)  # simulate network
    return f"content from {url}"

async def fetch_all(urls: list[str]) -> list[str]:
    # Use asyncio.gather
    pass
```

---

### 1.11 create_task
Same as 1.10 but use `asyncio.create_task()` explicitly.

```python
async def fetch_all_tasks(urls: list[str]) -> list[str]:
    # Use create_task
    pass
```

---

### 1.12 as_completed (async)
Print results as they complete (not in order).

```python
async def fetch_as_completed(urls: list[str]) -> None:
    # Print each result as it completes
    pass
```

---

### 1.13 Timeout (async)
Fetch with a timeout, return None if it times out.

```python
async def fetch_with_timeout(url: str, timeout: float) -> str | None:
    # Return content or None if timeout
    pass
```

---

### 1.14 Semaphore (async)
Limit concurrent fetches to 2 at a time.

```python
async def fetch_limited(urls: list[str], max_concurrent: int) -> list[str]:
    # Use asyncio.Semaphore to limit concurrency
    pass
```

---

### 1.15 Queue (async)
Implement async producer-consumer with `asyncio.Queue`.

```python
async def async_producer_consumer():
    # Producer puts items 1-10
    # Consumer processes them
    pass
```

---

## Completion Checklist

- [ ] 1.1 Basic Submit
- [ ] 1.2 Using map()
- [ ] 1.3 as_completed
- [ ] 1.4 Timeout Handling
- [ ] 1.5 ProcessPoolExecutor
- [ ] 1.6 Lock
- [ ] 1.7 Semaphore
- [ ] 1.8 Event
- [ ] 1.9 Queue (Producer-Consumer)
- [ ] 1.10 Basic gather
- [ ] 1.11 create_task
- [ ] 1.12 as_completed (async)
- [ ] 1.13 Timeout (async)
- [ ] 1.14 Semaphore (async)
- [ ] 1.15 Queue (async)
