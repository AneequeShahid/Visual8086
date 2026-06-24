org 100h

    mov cx, num    
    mov ax, 1      

factorial_loop:
    mul cx         
    loop factorial_loop 

    mov fact, ax   

    mov ah, 4ch
    int 21h

    num dw 5       
    fact dw ?