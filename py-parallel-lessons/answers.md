# Answers

## Level 1 Solutions

### 1.1 Basic Submit

```python
from concurrent.futures import ThreadPoolExecutor

def parallel_squares(numbers: list[int]) -> list[int]:
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(lambda x: x * x, n) for n in numbers]
        return [f.result() for f in futures]
```

**Note:** Results are collected in submission order because we iterate over `futures` in order.

---

### 1.2 Using map()

```python
from concurrent.futures import ThreadPoolExecutor

def parallel_squares_map(numbers: list[int]) -> list[int]:
    with ThreadPoolExecutor(max_workers=4) as executor:
        return list(executor.map(lambda x: x * x, numbers))
```

**Note:** `map()` automatically preserves input order and is more concise.

---

### 1.3 as_completed

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def squares_as_completed(numbers: list[int]) -> None:
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(lambda x: x * x, n): n for n in numbers}

        for future in as_completed(futures):
            original = futures[future]
            result = future.result()
            print(f"{original}^2 = {result}")
```

**Note:** Use a dict to map futures back to original inputs.

---

### 1.4 Timeout Handling

```python
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import time
import random

def slow_task():
    time.sleep(random.uniform(0.5, 2.0))
    return "done"

def run_with_timeout(timeout_seconds: float) -> str | None:
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(slow_task)
        try:
            return future.result(timeout=timeout_seconds)
        except TimeoutError:
            return None
```

---

### 1.5 ProcessPoolExecutor

```python
from concurrent.futures import ProcessPoolExecutor
import math

def parallel_factorials(numbers: list[int]) -> list[int]:
    with ProcessPoolExecutor(max_workers=4) as executor:
        return list(executor.map(math.factorial, numbers))
```

**Note:** For CPU-bound work, use `ProcessPoolExecutor` to bypass the GIL.

---

### 1.6 Lock

```python
from threading import Thread, Lock

def increment_counter(n_threads: int, increments_per_thread: int) -> int:
    counter = 0
    lock = Lock()

    def worker():
        nonlocal counter
        for _ in range(increments_per_thread):
            with lock:
                counter += 1

    threads = [Thread(target=worker) for _ in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    return counter
```

---

### 1.7 Semaphore

```python
from concurrent.futures import ThreadPoolExecutor
from threading import Semaphore
import time

def simulate_api_calls(n_calls: int, max_concurrent: int) -> list[str]:
    sem = Semaphore(max_concurrent)

    def api_call(n):
        with sem:
            time.sleep(0.1)  # simulate latency
            return f"result_{n}"

    with ThreadPoolExecutor(max_workers=n_calls) as executor:
        return list(executor.map(api_call, range(n_calls)))
```

---

### 1.8 Event

```python
from threading import Thread, Event, Lock
import time

def run_workers_until_stopped(n_workers: int, run_seconds: float) -> int:
    stop_event = Event()
    counter = 0
    lock = Lock()

    def worker():
        nonlocal counter
        while not stop_event.is_set():
            with lock:
                counter += 1
            time.sleep(0.001)

    threads = [Thread(target=worker) for _ in range(n_workers)]
    for t in threads:
        t.start()

    time.sleep(run_seconds)
    stop_event.set()

    for t in threads:
        t.join()

    return counter
```

---

### 1.9 Queue (Producer-Consumer)

```python
from queue import Queue
from threading import Thread

def producer_consumer_demo():
    q = Queue()

    def producer():
        for i in range(1, 11):
            q.put(i)
        q.put(None)  # sentinel

    def consumer():
        while (item := q.get()) is not None:
            print(f"Consumed: {item}")
            q.task_done()

    t1 = Thread(target=producer)
    t2 = Thread(target=consumer)

    t1.start()
    t2.start()

    t1.join()
    t2.join()
```

---

### 1.10 Basic gather

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)
    return f"content from {url}"

async def fetch_all(urls: list[str]) -> list[str]:
    return await asyncio.gather(*[fetch(url) for url in urls])

# Run with: asyncio.run(fetch_all(["url1", "url2", "url3"]))
```

---

### 1.11 create_task

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)
    return f"content from {url}"

async def fetch_all_tasks(urls: list[str]) -> list[str]:
    tasks = [asyncio.create_task(fetch(url)) for url in urls]
    return [await task for task in tasks]
```

**Note:** `create_task` schedules immediately; `await` collects results.

---

### 1.12 as_completed (async)

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)
    return f"content from {url}"

async def fetch_as_completed(urls: list[str]) -> None:
    tasks = [asyncio.create_task(fetch(url)) for url in urls]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        print(result)
```

---

### 1.13 Timeout (async)

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(1.0)
    return f"content from {url}"

async def fetch_with_timeout(url: str, timeout: float) -> str | None:
    try:
        return await asyncio.wait_for(fetch(url), timeout=timeout)
    except asyncio.TimeoutError:
        return None
```

---

### 1.14 Semaphore (async)

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)
    return f"content from {url}"

async def fetch_limited(urls: list[str], max_concurrent: int) -> list[str]:
    sem = asyncio.Semaphore(max_concurrent)

    async def limited_fetch(url):
        async with sem:
            return await fetch(url)

    return await asyncio.gather(*[limited_fetch(url) for url in urls])
```

---

### 1.15 Queue (async)

```python
import asyncio

async def async_producer_consumer():
    queue = asyncio.Queue()

    async def producer():
        for i in range(1, 11):
            await queue.put(i)
        await queue.put(None)

    async def consumer():
        while (item := await queue.get()) is not None:
            print(f"Consumed: {item}")
            queue.task_done()

    await asyncio.gather(producer(), consumer())

# Run with: asyncio.run(async_producer_consumer())
```

---

## Level 2 Solutions

### 2.1 Rate-Limited API Fetcher

**Approach:** `ThreadPoolExecutor` with `Semaphore` for rate limiting, or `asyncio` with `Semaphore`.

```python
from concurrent.futures import ThreadPoolExecutor
from threading import Semaphore
import time

def fetch(url: str) -> str:
    time.sleep(0.1)  # simulate network
    return f"content from {url}"

def fetch_all_rate_limited(urls: list[str], max_concurrent: int = 5) -> list[str | None]:
    sem = Semaphore(max_concurrent)

    def rate_limited_fetch(url):
        with sem:
            try:
                return fetch(url)
            except Exception:
                return None

    with ThreadPoolExecutor(max_workers=len(urls)) as executor:
        return list(executor.map(rate_limited_fetch, urls))
```

**Why this approach:**
- `executor.map` preserves order
- Semaphore limits concurrent execution
- More workers than semaphore allows is fine; they'll just block on the semaphore

---

### 2.2 Parallel File Processor with Progress

**Approach:** `as_completed` with thread-safe counter.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import time

def process_file(filepath: str) -> str:
    time.sleep(0.5)  # simulate work
    return f"processed {filepath}"

def process_files_with_progress(filepaths: list[str]) -> list[str]:
    results = {}
    completed = 0
    lock = Lock()
    total = len(filepaths)

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_path = {executor.submit(process_file, fp): fp for fp in filepaths}

        for future in as_completed(future_to_path):
            path = future_to_path[future]
            results[path] = future.result()

            with lock:
                completed += 1
                print(f"Completed {completed}/{total}")

    return [results[fp] for fp in filepaths]  # preserve order
```

---

### 2.3 Timeout with Fallback

**Approach:** Sequential with timeout on each attempt.

```python
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import time

def primary_service() -> str:
    time.sleep(3)  # too slow
    return "primary"

def backup_service() -> str:
    time.sleep(1)
    return "backup"

def call_with_fallback() -> str:
    with ThreadPoolExecutor(max_workers=1) as executor:
        # Try primary
        future = executor.submit(primary_service)
        try:
            return future.result(timeout=2)
        except TimeoutError:
            pass

        # Try backup
        future = executor.submit(backup_service)
        try:
            return future.result(timeout=5)
        except TimeoutError:
            raise Exception("Both services failed")
```

---

### 2.4 Batch Processor with Error Collection

**Approach:** Submit all, collect results and exceptions separately.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def process(item: str) -> str:
    if "bad" in item:
        raise ValueError(f"Cannot process {item}")
    return f"processed {item}"

def process_batch(items: list[str]) -> tuple[list[str], list[tuple[str, Exception]]]:
    results = []
    errors = []

    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_item = {executor.submit(process, item): item for item in items}

        for future in as_completed(future_to_item):
            item = future_to_item[future]
            try:
                results.append(future.result())
            except Exception as e:
                errors.append((item, e))

    return results, errors
```

---

### 2.5 Producer-Consumer with Multiple Workers

**Approach:** Queue with sentinel values (one per worker).

```python
from queue import Queue
from threading import Thread

def producer_consumer_system(n_workers: int) -> list[str]:
    queue = Queue()
    results = []
    results_lock = __import__('threading').Lock()

    def producer():
        for i in range(20):
            queue.put(f"job_{i}")
        for _ in range(n_workers):
            queue.put(None)  # sentinel for each worker

    def worker():
        while True:
            item = queue.get()
            if item is None:
                break
            result = f"processed_{item}"
            with results_lock:
                results.append(result)
            queue.task_done()

    producer_thread = Thread(target=producer)
    worker_threads = [Thread(target=worker) for _ in range(n_workers)]

    producer_thread.start()
    for w in worker_threads:
        w.start()

    producer_thread.join()
    for w in worker_threads:
        w.join()

    return results
```

---

### 2.6 Parallel Aggregation

**Approach:** `ProcessPoolExecutor` for CPU-bound work, combine results after.

```python
from concurrent.futures import ProcessPoolExecutor

def chunk_stats(numbers: list[int]) -> tuple[int, int]:
    return sum(numbers), len(numbers)

def parallel_sum_and_count(numbers: list[int], n_chunks: int) -> tuple[int, int]:
    chunk_size = len(numbers) // n_chunks
    chunks = [numbers[i:i + chunk_size] for i in range(0, len(numbers), chunk_size)]

    with ProcessPoolExecutor(max_workers=n_chunks) as executor:
        results = list(executor.map(chunk_stats, chunks))

    total_sum = sum(r[0] for r in results)
    total_count = sum(r[1] for r in results)
    return total_sum, total_count
```

---

### 2.7 Async Web Scraper

**Approach:** Two-level async with semaphore on inner level.

```python
import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.1)
    return f"content from {url}"

async def get_sub_urls(main_url: str) -> list[str]:
    await asyncio.sleep(0.1)
    return [f"{main_url}/sub_{i}" for i in range(3)]

async def scrape_site(main_urls: list[str]) -> dict[str, list[str]]:
    sem = asyncio.Semaphore(10)

    async def fetch_limited(url):
        async with sem:
            return await fetch(url)

    async def scrape_main(main_url):
        sub_urls = await get_sub_urls(main_url)
        sub_contents = await asyncio.gather(*[fetch_limited(u) for u in sub_urls])
        return main_url, sub_contents

    results = await asyncio.gather(*[scrape_main(url) for url in main_urls])
    return dict(results)
```

---

### 2.8 Graceful Shutdown

**Approach:** Event for shutdown signal, workers check after completing each item.

```python
from queue import Queue, Empty
from threading import Thread, Event
import signal
import time

def run_with_graceful_shutdown():
    queue = Queue()
    shutdown = Event()
    completed = []
    lock = __import__('threading').Lock()

    def worker():
        while not shutdown.is_set():
            try:
                item = queue.get(timeout=0.1)
            except Empty:
                continue
            # Process item completely before checking shutdown
            time.sleep(0.5)
            with lock:
                completed.append(f"done_{item}")
            queue.task_done()

    # Add some work
    for i in range(10):
        queue.put(i)

    workers = [Thread(target=worker) for _ in range(4)]
    for w in workers:
        w.start()

    # Simulate interrupt after 1 second
    time.sleep(1)
    shutdown.set()

    for w in workers:
        w.join()

    return completed
```

---

### 2.9 Dependency-Ordered Execution

**Approach:** Track pending/completed, execute tasks whose dependencies are met.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def execute_task(name: str) -> str:
    time.sleep(0.2)
    return name

def execute_with_dependencies(deps: dict[str, list[str]]) -> list[str]:
    completed = set()
    completion_order = []
    pending = set(deps.keys())

    with ThreadPoolExecutor(max_workers=4) as executor:
        while pending:
            # Find ready tasks (all dependencies completed)
            ready = [t for t in pending if all(d in completed for d in deps[t])]

            if not ready:
                raise ValueError("Circular dependency detected")

            # Submit ready tasks
            futures = {executor.submit(execute_task, t): t for t in ready}
            for t in ready:
                pending.remove(t)

            # Collect results
            for future in as_completed(futures):
                task_name = futures[future]
                future.result()  # ensure no exception
                completed.add(task_name)
                completion_order.append(task_name)

    return completion_order
```

---

### 2.10 Retry with Backoff

**Approach:** Wrap each fetch with retry logic inside the concurrent execution.

```python
from concurrent.futures import ThreadPoolExecutor
import time
import random

def fetch(url: str) -> str:
    if random.random() < 0.7:  # 70% failure rate for demo
        raise Exception("Network error")
    return f"content from {url}"

def fetch_with_retry_single(url: str, max_retries: int = 3) -> str | None:
    delays = [1, 2, 4]
    for attempt in range(max_retries):
        try:
            return fetch(url)
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(delays[attempt])
    return None

def fetch_with_retry(urls: list[str]) -> list[str | None]:
    with ThreadPoolExecutor(max_workers=10) as executor:
        return list(executor.map(fetch_with_retry_single, urls))
```

**Note:** The retry logic is inside each task. The executor handles concurrency; each task independently handles its own retries.
