# Python Concurrency Quick Reference

## Library Selection Guide

| Scenario | Library |
|----------|---------|
| Task parallelism, collect results | `concurrent.futures` |
| CPU-bound work | `ProcessPoolExecutor` |
| I/O-bound work (files, network) | `ThreadPoolExecutor` or `asyncio` |
| Shared state coordination | `threading` primitives |
| High-concurrency I/O (1000s of connections) | `asyncio` |

---

## 1. concurrent.futures

High-level interface for async execution. Use `ThreadPoolExecutor` for I/O-bound, `ProcessPoolExecutor` for CPU-bound.

### Submit and collect results

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(task, arg) for arg in args]

    for future in as_completed(futures):
        result = future.result()  # blocks until this future is done
```

### Map (preserves order)

```python
with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(task, args))  # results in input order
```

### Future methods

```python
future = executor.submit(task, arg)
future.result(timeout=5)    # get result, raise if timeout
future.done()               # True if completed
future.cancel()             # attempt to cancel
future.exception()          # get exception if raised
```

### ProcessPoolExecutor (CPU-bound)

```python
from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(cpu_heavy_task, args))
```

---

## 2. threading Primitives

Use alongside `concurrent.futures` when workers need coordination.

### Lock

```python
from threading import Lock

lock = Lock()

def task():
    with lock:
        # exclusive access to shared resource
        shared_list.append(value)
```

### Semaphore (limit concurrent access)

```python
from threading import Semaphore

sem = Semaphore(3)  # max 3 concurrent

def task():
    with sem:
        # at most 3 threads here simultaneously
        call_rate_limited_api()
```

### Event (signaling between threads)

```python
from threading import Event

stop_event = Event()

def worker():
    while not stop_event.is_set():
        do_work()

# From main thread:
stop_event.set()  # signal workers to stop
```

### Condition (wait for state change)

```python
from threading import Condition

condition = Condition()
data_ready = False

def consumer():
    with condition:
        condition.wait_for(lambda: data_ready)
        process(data)

def producer():
    global data_ready
    with condition:
        data = produce()
        data_ready = True
        condition.notify_all()
```

### Queue (thread-safe producer-consumer)

```python
from queue import Queue
from threading import Thread

q = Queue()

def producer():
    for item in items:
        q.put(item)
    q.put(None)  # sentinel

def consumer():
    while (item := q.get()) is not None:
        process(item)
        q.task_done()
```

---

## 3. asyncio

Single-threaded concurrency via coroutines. Best for I/O-bound with many concurrent operations.

### Basic pattern

```python
import asyncio

async def task(x):
    await asyncio.sleep(1)  # non-blocking wait
    return x * 2

async def main():
    results = await asyncio.gather(
        task(1),
        task(2),
        task(3),
    )
    return results

results = asyncio.run(main())
```

### Create tasks explicitly

```python
async def main():
    task1 = asyncio.create_task(fetch(url1))
    task2 = asyncio.create_task(fetch(url2))

    result1 = await task1
    result2 = await task2
```

### Process as completed

```python
async def main():
    tasks = [asyncio.create_task(fetch(url)) for url in urls]

    for coro in asyncio.as_completed(tasks):
        result = await coro
        print(result)
```

### Timeout

```python
try:
    result = await asyncio.wait_for(slow_task(), timeout=5.0)
except asyncio.TimeoutError:
    print("Task timed out")
```

### Semaphore (limit concurrency)

```python
sem = asyncio.Semaphore(10)

async def limited_fetch(url):
    async with sem:
        return await fetch(url)

async def main():
    tasks = [limited_fetch(url) for url in urls]
    return await asyncio.gather(*tasks)
```

### Queue

```python
queue = asyncio.Queue()

async def producer():
    for item in items:
        await queue.put(item)
    await queue.put(None)  # sentinel

async def consumer():
    while (item := await queue.get()) is not None:
        await process(item)
        queue.task_done()

# Run concurrently:
await asyncio.gather(producer(), consumer())
```
