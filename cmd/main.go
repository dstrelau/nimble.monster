package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"nimble.monster/internal/app"
)

func gracefulShutdown(s *http.Server, done chan bool) {
}

func main() {
	a, err := app.New()
	if err != nil {
		log.Fatalf("boot error: %s", err)
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", a.Port),
		Handler:      a,
		IdleTimeout:  time.Minute,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	done := make(chan struct{})
	go func() {
		ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
		defer stop()

		<-ctx.Done()

		log.Println("shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("shutdown error: %s", err)
		}
		if err := a.Shutdown(ctx); err != nil {
			log.Printf("shutdown error: %s", err)
		}
		close(done)
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go a.StartSessionCleanup(ctx)

	err = srv.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %s", err)
	}
	<-done
}
