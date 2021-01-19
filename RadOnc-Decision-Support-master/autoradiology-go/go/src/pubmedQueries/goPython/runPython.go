package gopy

import (
	"bytes"
	"os"
	"os/exec"
	. "pubmedQueries/types"
)

/*
	RunPython is a general purpose function for calling python scripts from Go.
	Supports input redirection using the in_str. The first arg in args should
	be the command/script to run. Note that RunPython calls scripts using
	python3.7 as the interpreter. Captures output from the script and returns
	it as a []byte.
*/
func RunPython(in_str []byte, args ...string) ([]byte, error) {

	cmd := exec.Command("python3.7", args...)
	cmd.Env = append(os.Environ())
	// Get a pipe to cmd.stdout to that we can read what the process does.
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = os.Stderr

	if in_str != nil {
		stdin, _ := cmd.StdinPipe()
		go func() {
			defer stdin.Close()
			if _, err := stdin.Write(in_str); err != nil {
				PubmedLogger.Printf("Runpython stdin error: ", err)
			}
		}()
	}

	if err := cmd.Run(); err != nil {
		PubmedLogger.Printf("RunPython: Failed to start python")
		return nil, err
	}

	return stdout.Bytes(), nil
}

